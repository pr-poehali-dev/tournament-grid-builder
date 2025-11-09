'''
Business: API для управления турнирными сетками олимпийской системы
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с турнирами и матчами
'''
import json
import os
import psycopg2
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import math


@dataclass
class Tournament:
    name: str
    weight_category: str
    age_category: str
    total_participants: int
    id: Optional[int] = None


def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def generate_bracket(tournament_id: int, participants: List[Dict], conn) -> List[Dict]:
    '''Генерация олимпийской сетки'''
    num_participants = len(participants)
    num_rounds = math.ceil(math.log2(num_participants))
    total_slots = 2 ** num_rounds
    
    matches = []
    cursor = conn.cursor()
    
    # Первый раунд
    for i in range(0, total_slots, 2):
        p1 = participants[i] if i < num_participants else None
        p2 = participants[i + 1] if i + 1 < num_participants else None
        
        cursor.execute('''
            INSERT INTO matches (tournament_id, round_number, match_number, participant1_id, participant2_id, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (tournament_id, 1, i // 2 + 1, p1['id'] if p1 else None, p2['id'] if p2 else None, 'pending'))
        
        match_id = cursor.fetchone()[0]
        matches.append({
            'id': match_id,
            'round': 1,
            'match_number': i // 2 + 1,
            'participant1': p1['name'] if p1 else 'BYE',
            'participant2': p2['name'] if p2 else 'BYE'
        })
    
    # Создаем пустые матчи для следующих раундов
    for round_num in range(2, num_rounds + 1):
        matches_in_round = 2 ** (num_rounds - round_num)
        for match_num in range(1, matches_in_round + 1):
            cursor.execute('''
                INSERT INTO matches (tournament_id, round_number, match_number, status)
                VALUES (%s, %s, %s, %s)
            ''', (tournament_id, round_num, match_num, 'pending'))
    
    conn.commit()
    return matches


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Создание турнира
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            name = body_data.get('name', 'Новый турнир')
            weight_category = body_data['weight_category']
            age_category = body_data['age_category']
            participants_data = body_data['participants']
            total_participants = len(participants_data)
            
            # Создаем турнир
            cursor.execute('''
                INSERT INTO tournaments (name, weight_category, age_category, total_participants)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            ''', (name, weight_category, age_category, total_participants))
            
            tournament_id = cursor.fetchone()[0]
            
            # Добавляем участников
            participants = []
            for idx, p_name in enumerate(participants_data):
                cursor.execute('''
                    INSERT INTO participants (tournament_id, name, seed_number, weight_category, age_category)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, name
                ''', (tournament_id, p_name, idx + 1, weight_category, age_category))
                
                p_id, p_name_db = cursor.fetchone()
                participants.append({'id': p_id, 'name': p_name_db})
            
            # Генерируем сетку
            matches = generate_bracket(tournament_id, participants, conn)
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'tournament_id': tournament_id,
                    'message': 'Турнир создан успешно',
                    'matches': matches
                }, ensure_ascii=False)
            }
        
        # Получение турнира
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            tournament_id = params.get('tournament_id')
            
            if tournament_id:
                # Получаем информацию о турнире
                cursor.execute('SELECT * FROM tournaments WHERE id = %s', (tournament_id,))
                tournament = cursor.fetchone()
                
                if not tournament:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Турнир не найден'}),
                        'isBase64Encoded': False
                    }
                
                # Получаем матчи
                cursor.execute('''
                    SELECT m.id, m.round_number, m.match_number, 
                           p1.name as p1_name, p2.name as p2_name, 
                           w.name as winner_name, m.score, m.status
                    FROM matches m
                    LEFT JOIN participants p1 ON m.participant1_id = p1.id
                    LEFT JOIN participants p2 ON m.participant2_id = p2.id
                    LEFT JOIN participants w ON m.winner_id = w.id
                    WHERE m.tournament_id = %s
                    ORDER BY m.round_number, m.match_number
                ''', (tournament_id,))
                
                matches = cursor.fetchall()
                matches_list = [{
                    'id': m[0],
                    'round': m[1],
                    'match_number': m[2],
                    'participant1': m[3],
                    'participant2': m[4],
                    'winner': m[5],
                    'score': m[6],
                    'status': m[7]
                } for m in matches]
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'tournament': {
                            'id': tournament[0],
                            'name': tournament[1],
                            'weight_category': tournament[2],
                            'age_category': tournament[3],
                            'total_participants': tournament[4],
                            'status': tournament[5]
                        },
                        'matches': matches_list
                    }, ensure_ascii=False)
                }
            else:
                # Список всех турниров
                cursor.execute('SELECT * FROM tournaments ORDER BY created_at DESC LIMIT 50')
                tournaments = cursor.fetchall()
                
                tournaments_list = [{
                    'id': t[0],
                    'name': t[1],
                    'weight_category': t[2],
                    'age_category': t[3],
                    'total_participants': t[4],
                    'status': t[5],
                    'created_at': str(t[6])
                } for t in tournaments]
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'tournaments': tournaments_list}, ensure_ascii=False)
                }
        
        # Обновление результата матча
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            match_id = body_data['match_id']
            winner_id = body_data['winner_id']
            score = body_data.get('score', '')
            
            cursor.execute('''
                UPDATE matches 
                SET winner_id = %s, score = %s, status = %s
                WHERE id = %s
                RETURNING tournament_id, round_number, match_number
            ''', (winner_id, score, 'completed', match_id))
            
            result = cursor.fetchone()
            tournament_id, round_num, match_num = result
            
            # Продвигаем победителя в следующий раунд
            next_match_num = (match_num + 1) // 2
            cursor.execute('''
                SELECT id, participant1_id FROM matches 
                WHERE tournament_id = %s AND round_number = %s AND match_number = %s
            ''', (tournament_id, round_num + 1, next_match_num))
            
            next_match = cursor.fetchone()
            if next_match:
                next_match_id, p1_id = next_match
                if p1_id is None:
                    cursor.execute('UPDATE matches SET participant1_id = %s WHERE id = %s', (winner_id, next_match_id))
                else:
                    cursor.execute('UPDATE matches SET participant2_id = %s WHERE id = %s', (winner_id, next_match_id))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'message': 'Результат обновлен'}, ensure_ascii=False)
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
        
    finally:
        cursor.close()
        conn.close()

import psycopg2
import os

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST"),
        port=os.getenv("POSTGRES_PORT"),
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD")
    )

def run_sql_file(cursor, filepath):
    with open(filepath, "r") as f:
        cursor.execute(f.read())

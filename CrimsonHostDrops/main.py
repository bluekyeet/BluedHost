import random
import string
import time
import requests


def generate_prize_amount():
    return random.choice([i for i in range(100, 3000, 100)])

def create_coupons(prize, code):
    data = {
        "code": code,
        "coins": prize,
        "ram": 0,
        "cpu": 0,
        "disk": 0,
        "servers": 0
    }
    requests.post("https://dash.crimsonhost.xyz/api/createcoupon", json=data, headers={
        'Authorization': f'Bearer cufnjksehfuissofoiwehuifwehuifwe'
    })
    return

def send_coupons():
    prize = generate_prize_amount()
    codes = [''.join(random.choices(string.ascii_uppercase, k=20)) for _ in range(5)]
    for code in codes:
        create_coupons(prize, code)
    message = f"{prize} coins drop! Codes: {', '.join(codes)}"
    webhook_url = "https://discord.com/api/webhooks/1342752243182469230/F4yh6n4LzbxZG66RhQde_HtFYXuEUXKOF-VGNH5fEdTj9rhsW02nb6uEyJBbK9ww6yKb"
    payload = {"content": message}
    requests.post(webhook_url, json=payload)

while True:
    send_coupons()
    time.sleep(3600)
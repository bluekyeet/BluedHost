from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from apscheduler.schedulers.background import BackgroundScheduler
import random
import requests
from datetime import datetime
import pytz

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lottery.db'
db = SQLAlchemy(app)
lottery_enabled = True

class Entry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)
    number = db.Column(db.Integer, nullable=False)


class User(db.Model):
    user_id = db.Column(db.String(50), primary_key=True)
    entries = db.Column(db.Integer, default=0)

class Lottery(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    prize_amount = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)

def init_db():
    with app.app_context():
        db.create_all()
        print("Database initialized successfully!")
        first_lottery()
@app.route('/enter', methods=['POST'])
def enter():
    global lottery_enabled
    if not lottery_enabled:
        return jsonify({"error": "Lottery is not enabled. Please wait until the next hour for the next lottery."}), 400

    data = request.get_json()
    user_id = data['id']
    number = int(data['number'])

    if not (1 <= number <= 500):
        return jsonify({"error": "Number must be between 1 and 500"}), 400

    user = User.query.filter_by(user_id=user_id).first()
    if user and user.entries >= 10:
        return jsonify({"error": "Maximum entries reached"}), 400
    elif not user:
        user = User(user_id=user_id, entries=0)
        db.session.add(user)

    new_entry = Entry(user_id=user_id, number=number)
    db.session.add(new_entry)
    user.entries += 1
    db.session.commit()

    return jsonify({"message": "Entry added successfully"}), 201


def generate_prize_amount():
    return random.choice([i for i in range(1000, 10001, 1000)])


def check_lottery():
    with app.app_context():
        global lottery_enabled
        entries = Entry.query.all()
        if not entries:
            print("No entries found.")
            return

        latest_lottery = Lottery.query.order_by(Lottery.date.desc()).first()
        if not latest_lottery:
            print("No lottery prize found.")
            return

        prize_amount = latest_lottery.prize_amount
        winning_number = random.randint(1, 100)

        winners = [entry for entry in entries if entry.number == winning_number]
        winner_ids = [winner.user_id for winner in winners]

        if winners:
            prize_per_winner = prize_amount // len(winners)
            message = f"Congratulations to the winners with IDs: {', '.join([f'<@{winner_id}>' for winner_id in winner_ids])}! The winning number was {winning_number}. Each winner receives {prize_per_winner} coins."
        else:
            message = f"No winners this time. The prize amount was {prize_amount}. The winning number was {winning_number}. Better luck next time!"

        webhook_url = "https://discord.com/api/webhooks/1328677800407859220/tdn2Mr29Y89TKxpkkl__gS9gXho_0tpk0TIgS22srzpp9zqeUDxJKPyIgx9aXhtGtXsc"
        payload = {"content": message}
        requests.post(webhook_url, json=payload)

        for winner_id in winner_ids:
            data = {"id": winner_id, "coins": prize_per_winner}
            try:
                response = requests.post("https://dash.crimsonhost.xyz/api/addcoins", json=data, headers={
                    'Authorization': f'Bearer cufnjksehfuissofoiwehuifwehuifwe'
                })
                if response.status_code == 200:
                    print(f"Coins added successfully for user {winner_id}")
                else:
                    print(f"Failed to add coins for user {winner_id}")
            except Exception as e:
                print(f"Error adding coins for user {winner_id}: {e}")

        Entry.query.delete()
        db.session.commit()

        lottery_enabled = False


def announce_next_prize():
    with app.app_context():
        global lottery_enabled
        prize_amount = generate_prize_amount()
        new_lottery = Lottery(prize_amount=prize_amount)
        db.session.add(new_lottery)
        db.session.commit()

        webhook_url = "https://discord.com/api/webhooks/1328677800407859220/tdn2Mr29Y89TKxpkkl__gS9gXho_0tpk0TIgS22srzpp9zqeUDxJKPyIgx9aXhtGtXsc"
        message = f"The prize amount for the next lottery is {prize_amount}! If there multiple winners, the prize will be split equally among them. <@&1247129171369529487>"
        payload = {"content": message}
        requests.post(webhook_url, json=payload)

        lottery_enabled = True

def first_lottery():
    latest_lottery = Lottery.query.order_by(Lottery.date.desc()).first()
    if not latest_lottery:
        print("No lottery prize found. Announcing first lottery.")
        announce_next_prize()

scheduler = BackgroundScheduler()
scheduler.add_job(func=check_lottery, trigger='cron', minute=55, timezone='Asia/Kolkata')
scheduler.add_job(func=announce_next_prize, trigger='cron', minute=0, timezone='Asia/Kolkata')
scheduler.start()

if __name__ == '__main__':
    init_db()
    app.run(debug=False, port=25004, host="0.0.0.0")
import requests
from flask import Flask, request, jsonify, Response
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding as sym_padding
from cryptography.hazmat.backends import default_backend
import base64
import os
import json

app = Flask(__name__)

key = b'uiewiofweofwfwjf'

def encrypt_string(input_string, key):
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    padder = sym_padding.PKCS7(algorithms.AES.block_size).padder()
    padded_data = padder.update(input_string.encode()) + padder.finalize()
    encrypted_bytes = encryptor.update(padded_data) + encryptor.finalize()
    return base64.b64encode(iv + encrypted_bytes).decode()

def decrypt_string(encrypted_string, key):
    encrypted_bytes = base64.b64decode(encrypted_string)
    iv = encrypted_bytes[:16]
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted_padded_bytes = decryptor.update(encrypted_bytes[16:]) + decryptor.finalize()
    unpadder = sym_padding.PKCS7(algorithms.AES.block_size).unpadder()
    decrypted_bytes = unpadder.update(decrypted_padded_bytes) + unpadder.finalize()
    return decrypted_bytes.decode()

random_strings = {}

@app.route('/ping', methods=['GET'])
def ping():
    device_id = request.args.get('device_id')
    if not device_id:
        return jsonify({"status": "error", "message": "Device ID is required"}), 400
    random_string = os.urandom(16).hex()
    random_strings[device_id] = random_string
    return jsonify({"data": random_string})

@app.route('/ping', methods=['POST'])
def handle_post():
    data = request.get_json()
    device_id = data.get("device_id")
    userid = data.get("id")
    encrypted_string = data.get("data")
    encrypted_coins = data.get("coins")

    if not encrypted_string:
        return jsonify({"status": "error", "message": "Data is required"}), 400
    if not encrypted_coins:
        return jsonify({"status": "error", "message": "Coins is required"}), 400
    if not device_id:
        return jsonify({"status": "error", "message": "Device ID is required"}), 400
    if device_id not in random_strings:
        return jsonify({"status": "error", "message": "Invalid device ID"}), 400

    decrypted_string = decrypt_string(encrypted_string, key)
    decrypted_string_json = json.loads(decrypted_string)

    decrypted_coins = decrypt_string(encrypted_coins, key)
    decrypted_coins = json.loads(decrypted_coins)

    if decrypted_string_json["data"] == random_strings[device_id]:
        del random_strings[device_id]
        coins = int(decrypted_coins // 1)
        data = {"id": userid, "coins": coins}
        request_data = requests.post('https://dash.crimsonhost.xyz/api/addcoins/', headers={'Authorization': f'Bearer cufnjksehfuissofoiwehuifwehuifwe'}, json=data)
        if request_data.status_code == 200:
            return jsonify({"status": "success", "message": f"Coins added to user: {coins}"}), 200
        else:
            return jsonify({"status": "error", "message": f"Failed to add"}), 400
    else:
        return jsonify({"status": "error", "message": "Invalid data"}), 400

@app.post('/userid')
def get():
    userdata = request.get_json()
    userid = userdata['id']
    request_data = requests.get('https://dash.crimsonhost.xyz/api/userinfo/', headers={"Authorization": "Bearer cufnjksehfuissofoiwehuifwehuifwe"}, params={"id": userid})
    request_data.raise_for_status()
    data = request_data.json()
    if data.get("status") == "invalid id":
        return Response(status=404)
    else:
        return Response(status=200)

if __name__ == '__main__':
    app.run(port=5001)
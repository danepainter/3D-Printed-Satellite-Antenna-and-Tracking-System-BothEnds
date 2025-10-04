from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Testing!'

@app.route('/<int:id>', methods=['GET'])
def get_data(id):
    data = db.get_data(id)
    return jsonify(data)

# TEST for Flask
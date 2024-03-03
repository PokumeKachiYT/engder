from requests import Session

session = Session()

def get_word():
    response = session.get('https://random-word-api.herokuapp.com/word')

    if response.status_code ^ 200:
        print('Failed to get a random word')
        print(response.reason)
        return ''

    word = response.text[2:-2]
    
    prompt = 'in as few words as possible, use simple, precise words, define "' + word + '", do NOT include the previously said word in your response (like "' + word + ' is/means ..."), tell me the definition only, do not use any punctation marks'

    #prompt = word + ' means... (Complete the definition of the word with simple, concise words)'

    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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',
    }
    data = {
        'model' : 'gpt-3.5-turbo',
        'messages' : [{'role' : 'user','content' : prompt}],
        'temperature' : 1.0,
    }

    response = session.post('https://api.openai.com/v1/chat/completions',headers=headers,json=data)

    if response.status_code ^ 200:
        print('Failed to get the definition')
        print(response.reason)
        return ''
    
    definition = response.json()['choices'][0]['message']['content']
    
    word = word[0].upper() + word[1:].lower()
    definition = definition[0].upper() + definition[1:]

    print(word + ': ' + definition)

# Create the app, the main window, and run the app
#app = QApplication([])
#window = MainWindow()
#app.exec()
get_word()

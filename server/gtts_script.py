import sys
from gtts import gTTS

try:
    if len(sys.argv) < 3:
        raise ValueError("Missing arguments")
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    with open(input_file, 'r', encoding='utf-8') as f:
        text = f.read().strip()
        
    if not text:
        raise ValueError("Empty input text")
        
    tts = gTTS(text=text, lang='en')
    tts.save(output_file)
    print(f"SUCCESS:{output_file}")
except Exception as e:
    print(f"ERROR:{str(e)}")

import secrets, string
ALPH = string.ascii_letters + string.digits + '!@#$%^&*-_=+?'
for _ in range(10):
    print('  ' + ''.join(secrets.choice(ALPH) for _ in range(20)))
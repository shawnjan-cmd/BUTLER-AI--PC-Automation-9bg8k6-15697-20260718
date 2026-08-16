import secrets, string
LEN = 20
alpha = string.ascii_letters + string.digits + "!@#$%^&*()-_=+[]{};:,.?"
while True:
    pw = "".join(secrets.choice(alpha) for _ in range(LEN))
    if (any(c.islower() for c in pw) and any(c.isupper() for c in pw)
        and any(c.isdigit() for c in pw) and any(c in "!@#$%^&*()-_=+[]{};:,.?" for c in pw)):
        break
print(pw)
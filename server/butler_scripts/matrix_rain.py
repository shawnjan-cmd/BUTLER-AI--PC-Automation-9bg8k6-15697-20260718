import random, shutil, time, sys
COLS, ROWS = shutil.get_terminal_size((80, 24))
drops = [0]*COLS
CHARS = "01アイウエオカキクケコサシスセソタチツテト"
print("\033[2J\033[?25l", end="")
try:
    while True:
        out = ""
        for i in range(COLS):
            if drops[i]:
                out += f"\033[{drops[i]};{i+1}H\033[32m{random.choice(CHARS)}\033[0m"
                drops[i] += 1
                if drops[i] > ROWS or random.random() > .95: drops[i] = 0
            elif random.random() > .98:
                drops[i] = 1
        sys.stdout.write(out); sys.stdout.flush()
        time.sleep(0.06)
except KeyboardInterrupt:
    print("\033[?25h\033[2J")
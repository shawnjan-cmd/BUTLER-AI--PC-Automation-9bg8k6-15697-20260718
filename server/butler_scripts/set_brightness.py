try:
    import screen_brightness_control as sbc
except ImportError:
    print('Install: pip install screen-brightness-control'); raise SystemExit
try:
    sbc.set_brightness(50)
    print(f'✓ Brightness set to {sbc.get_brightness()}')
except Exception as e:
    print(f'Failed: {e}')
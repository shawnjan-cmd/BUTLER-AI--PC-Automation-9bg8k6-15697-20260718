try:
    import psutil, socket
except ImportError:
    print('Install psutil: pip install psutil'); raise SystemExit
addrs = psutil.net_if_addrs(); stats = psutil.net_if_stats()
for nic, alist in addrs.items():
    st = stats.get(nic)
    up = '\u2191 UP' if st and st.isup else 'down'
    speed = f'{st.speed} Mbps' if st and st.speed else '?'
    print(f'\n[{nic}]  {up}  speed={speed}  mtu={st.mtu if st else "?"}')
    for a in alist:
        fam = {socket.AF_INET:'IPv4', socket.AF_INET6:'IPv6'}.get(a.family, 'MAC')
        print(f'   {fam:4s} {a.address}  netmask={a.netmask}')
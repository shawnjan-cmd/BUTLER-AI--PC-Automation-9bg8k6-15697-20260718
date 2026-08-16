from voice_lane import LOW_SPEC, BALANCED, accept_audio_chunk, choose_route, truncate_response

assert choose_route(cpu_percent=95, ram_percent=40, available_models=['small']) is None
route = choose_route(cpu_percent=72, ram_percent=78, available_models=['small'])
assert route is not None and route.budget is LOW_SPEC
assert accept_audio_chunk(b'1' * 100, LOW_SPEC, 10)
assert not accept_audio_chunk(b'1' * (LOW_SPEC.max_audio_bytes + 1), LOW_SPEC, 10)
assert not accept_audio_chunk(b'1', LOW_SPEC, LOW_SPEC.max_audio_seconds + 1)
assert len(truncate_response('x' * 10_000, BALANCED)) == BALANCED.max_response_chars
print('voice lane policy: PASS')

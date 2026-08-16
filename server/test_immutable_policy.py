from immutable_policy import IMMUTABLE_RULES, assert_intact, public_rules

assert_intact()
assert len(IMMUTABLE_RULES) == 3
assert [rule.rule_id for rule in IMMUTABLE_RULES] == [
    'MEMORY_NO_PLAINTEXT',
    'NO_PRIVATE_DATA_EXFILTRATION',
    'NO_UNTRUSTED_SIDE_EFFECTS',
]
assert all(item['id'] and item['title'] and item['text'] for item in public_rules())
print('IMMUTABLE POLICY TESTS PASSED')

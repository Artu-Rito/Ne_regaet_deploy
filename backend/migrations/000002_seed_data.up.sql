-- Game servers: real IPs for TCP ping measurement (Valve SDR relays + known game infra)
INSERT INTO game_servers (id, name, ip, port, game, region) VALUES
(uuid_generate_v4(), 'CS2 Москва',        '185.25.182.9',    27015, 'CS2',        'RU'),
(uuid_generate_v4(), 'CS2 Франкфурт',     '155.133.248.90',  27015, 'CS2',        'EU'),
(uuid_generate_v4(), 'Dota 2 Москва',     '185.25.182.10',   27015, 'Dota2',      'RU'),
(uuid_generate_v4(), 'Dota 2 Стокгольм',  '155.133.249.6',   27015, 'Dota2',      'EU'),
(uuid_generate_v4(), 'Valorant EU',        '104.160.131.3',   443,   'Valorant',   'EU'),
(uuid_generate_v4(), 'WoW Франкфурт',     '37.244.47.12',    443,   'WoW',        'EU'),
(uuid_generate_v4(), 'Apex Amsterdam',    '104.22.52.230',   443,   'Apex',       'EU'),
(uuid_generate_v4(), 'PUBG Сеул',         '203.248.160.0',   443,   'PUBG',       'ASIA'),
(uuid_generate_v4(), 'Overwatch 2 Париж', '37.244.48.0',     443,   'Overwatch2', 'EU'),
(uuid_generate_v4(), 'CS2 Варшава',       '185.40.64.5',     27015, 'CS2',        'EU')
ON CONFLICT DO NOTHING;

-- Lista inicial de produtos da ISFA (todos publicados, sem preço nem stock confirmados).
-- As fotografias "builtin:" são as três já incluídas no site; as restantes carregam-se no painel de gestão.
insert into public.products
  (id, name, reference, category, brand, model, short_description, description, specs, price, show_price, stock, show_stock, main_image, images, featured, published, sort_order)
values
('bomba-de-infusao', 'Bomba de infusão', '', 'Equipamentos médicos e hospitalares', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 1),
('bomba-de-injecao', 'Bomba de injeção', '', 'Equipamentos médicos e hospitalares', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 2),
('bomba-de-aspiracao-de-secrecoes', 'Bomba de aspiração de secreções', '', 'Equipamentos médicos e hospitalares', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 3),
('monitor-multiparametrico', 'Monitor multiparamétrico', '', 'Equipamentos médicos e hospitalares', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 4),
('eletrocardiografo-ecg-de-1-canal', 'Eletrocardiógrafo (ECG) de 1 canal', '', 'Equipamentos médicos e hospitalares', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 5),
('eletrocardiografo-ecg-de-3-canais', 'Eletrocardiógrafo (ECG) de 3 canais', '', 'Equipamentos médicos e hospitalares', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 6),
('eletrocardiografo-ecg-de-6-canais', 'Eletrocardiógrafo (ECG) de 6 canais', '', 'Equipamentos médicos e hospitalares', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 7),
('eletrocardiografo-ecg-de-12-canais', 'Eletrocardiógrafo (ECG) de 12 canais', '', 'Equipamentos médicos e hospitalares', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 8),
('balanca-para-adultos', 'Balança para adultos', '', 'Equipamentos médicos e hospitalares', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 9),
('cama-hospitalar', 'Cama hospitalar', '', 'Equipamentos médicos e hospitalares', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 10),
('maca-hospitalar', 'Maca hospitalar', '', 'Equipamentos médicos e hospitalares', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 11),
('centrifuga-laboratorial-de-6-tubos', 'Centrífuga laboratorial de 6 tubos', '', 'Equipamentos laboratoriais', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 12),
('centrifuga-laboratorial-de-12-tubos', 'Centrífuga laboratorial de 12 tubos', '', 'Equipamentos laboratoriais', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 13),
('centrifuga-laboratorial-de-24-tubos', 'Centrífuga laboratorial de 24 tubos', '', 'Equipamentos laboratoriais', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 14),
('microscopio-optico-binocular', 'Microscópio óptico binocular', '', 'Equipamentos laboratoriais', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 15),
('banho-maria-laboratorial', 'Banho-maria laboratorial', '', 'Equipamentos laboratoriais', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 16),
('cadeira-de-rodas-convencional', 'Cadeira de rodas convencional', '', 'Mobilidade e reabilitação', '', '', 'Cadeira de rodas com estrutura laranja e verde, assento acolchoado e apoios de pés.', 'Cadeira de rodas com estrutura de cor laranja e verde, assento e costas acolchoados em preto, apoios de braços e apoios de pés com tira de apoio às pernas. Rodas traseiras grandes com aros de propulsão e rodas dianteiras pequenas, com punhos de empurrar na parte de trás.

Medidas, capacidade de carga, preço e disponibilidade devem ser confirmados com a equipa da ISFA.', '[{"label":"Cor da estrutura","value":"Laranja e verde"},{"label":"Assento e costas","value":"Acolchoados, em preto"}]'::jsonb, null, false, null, false, 'builtin:cadeira-de-rodas', array['builtin:cadeira-de-rodas']::text[], false, true, 17),
('cadeira-de-rodas-robusta', 'Cadeira de rodas robusta', '', 'Mobilidade e reabilitação', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 18),
('cadeira-de-rodas-eletrica', 'Cadeira de rodas elétrica', '', 'Mobilidade e reabilitação', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 19),
('muletas-convencionais', 'Muletas convencionais', '', 'Mobilidade e reabilitação', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 20),
('muletas-de-axila', 'Muletas de axila', '', 'Mobilidade e reabilitação', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 21),
('cadeira-para-higienizacao-com-rodas', 'Cadeira para higienização com rodas', '', 'Mobilidade e reabilitação', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 22),
('cadeira-para-higienizacao-sem-rodas', 'Cadeira para higienização sem rodas', '', 'Mobilidade e reabilitação', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 23),
('maleta-medica', 'Maleta médica', '', 'Acessórios e materiais de apoio clínico', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 24),
('lencois-hospitalares-azuis', 'Lençóis hospitalares azuis', '', 'Acessórios e materiais de apoio clínico', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 25),
('lencois-hospitalares-brancos', 'Lençóis hospitalares brancos', '', 'Acessórios e materiais de apoio clínico', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 26),
('lencois-hospitalares-verdes', 'Lençóis hospitalares verdes', '', 'Acessórios e materiais de apoio clínico', '', '', '', '', '[]'::jsonb, null, false, null, false, '', '{}'::text[], false, true, 27),
('kit-primeiros-socorros', 'Kit de primeiros socorros', 'GKB300', 'Acessórios e materiais de apoio clínico', '', '', 'Caixa de primeiros socorros laranja, com pega e fecho, identificada com o código GKB300.', 'Caixa de primeiros socorros em plástico rígido de cor laranja, com pega superior e fecho. A inscrição na própria caixa indica o código GKB300 e a indicação "For 100 People" (para 100 pessoas).

O conteúdo, o preço e a disponibilidade devem ser confirmados com a equipa da ISFA no momento da cotação.', '[{"label":"Código indicado na caixa","value":"GKB300"},{"label":"Cor","value":"Laranja"},{"label":"Indicação na caixa","value":"Para 100 pessoas"}]'::jsonb, null, false, null, false, 'builtin:kit-primeiros-socorros', array['builtin:kit-primeiros-socorros']::text[], true, true, 28),
('kit-instrumentos-cirurgicos', 'Kit de instrumentos cirúrgicos', '', 'Equipamentos médicos e hospitalares', '', '', 'Estojo com fecho de correr e vários instrumentos metálicos em bolsas individuais.', 'Estojo com fecho de correr e interior vermelho, com instrumentos metálicos organizados em bolsas de plástico individuais presas por elásticos. Inclui tesouras, pinças e outros instrumentos, visíveis na fotografia.

A lista completa de peças, o material, o preço e a disponibilidade devem ser confirmados com a equipa da ISFA.', '[{"label":"Embalagem","value":"Estojo com fecho de correr"},{"label":"Interior","value":"Vermelho, com elásticos de fixação"}]'::jsonb, null, false, null, false, 'builtin:kit-instrumentos-cirurgicos', array['builtin:kit-instrumentos-cirurgicos']::text[], false, true, 29)
on conflict (id) do nothing;

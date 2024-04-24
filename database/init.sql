COPY public.users (id, email, name, address, zip, city, country, created, updated, settings, password, "lastSeen") FROM stdin;
1	test@localhost	Test User	Road 66	12345-FI	Tampere	Finland	2024-03-30 14:38:56.726	2024-04-05 10:46:46.293	{"projectId": 1}	$2b$13$YAnqCS/Zsov6Bt5fR3phDelItsA6PpCLYl/kotccl5hAgbVojUQqC	\N
\.

COPY public.projects (id, name, created, updated, "userId", settings) FROM stdin;
1	Testing	2024-03-30 14:39:17.243	2024-04-09 17:51:20.083	1	{"currency": "EUR", "language": "fi"}
\.

COPY public.settings (id, type, url, certificate, "user", password, options, apikey) FROM stdin;
2	TEST_MOCK	\N	\N	\N	\N	{}	\N
\.

COPY public.flow_plans (id, title, created, updated, "projectId", "lastStamp", state, stock) FROM stdin;
1	Unit Testing	2024-03-30 14:39:53.161	2024-04-09 08:48:44.034	1	\N	{}	{}
\.

COPY public.input_sources (id, type, "flowPlanId", created, updated, settings) FROM stdin;
1	TEST_MOCK	1	2024-03-30 14:41:15.195	2024-04-02 17:06:29.167	{"url": "file:///test.csv"}
\.

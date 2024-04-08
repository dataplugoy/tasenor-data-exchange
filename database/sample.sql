--
-- PostgreSQL database dump
--

-- Dumped from database version 14.5
-- Dumped by pg_dump version 14.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.unified_items DROP CONSTRAINT IF EXISTS "unified_items_runId_fkey";
ALTER TABLE IF EXISTS ONLY public.unified_items DROP CONSTRAINT IF EXISTS "unified_items_inputId_fkey";
ALTER TABLE IF EXISTS ONLY public.unified_items DROP CONSTRAINT IF EXISTS "unified_items_flowPlanId_fkey";
ALTER TABLE IF EXISTS ONLY public.unified_items DROP CONSTRAINT IF EXISTS "unified_items_batchId_fkey";
ALTER TABLE IF EXISTS ONLY public.runs DROP CONSTRAINT IF EXISTS "runs_batchId_fkey";
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS "projects_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.input_sources DROP CONSTRAINT IF EXISTS "input_sources_flowPlanId_fkey";
ALTER TABLE IF EXISTS ONLY public.input_items DROP CONSTRAINT IF EXISTS "input_items_runId_fkey";
ALTER TABLE IF EXISTS ONLY public.input_items DROP CONSTRAINT IF EXISTS "input_items_flowPlanId_fkey";
ALTER TABLE IF EXISTS ONLY public.input_items DROP CONSTRAINT IF EXISTS "input_items_batchId_fkey";
ALTER TABLE IF EXISTS ONLY public.flow_plans DROP CONSTRAINT IF EXISTS "flow_plans_projectId_fkey";
ALTER TABLE IF EXISTS ONLY public.batches DROP CONSTRAINT IF EXISTS "batches_flowPlanId_fkey";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public."unified_items_inputId_key";
DROP INDEX IF EXISTS public.settings_type_key;
DROP INDEX IF EXISTS public."rules_type_ownerId_name_key";
DROP INDEX IF EXISTS public."input_sources_flowPlanId_key";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.unified_items DROP CONSTRAINT IF EXISTS unified_items_pkey;
ALTER TABLE IF EXISTS ONLY public.settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE IF EXISTS ONLY public.runs DROP CONSTRAINT IF EXISTS runs_pkey;
ALTER TABLE IF EXISTS ONLY public.rules DROP CONSTRAINT IF EXISTS rules_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.input_sources DROP CONSTRAINT IF EXISTS input_sources_pkey;
ALTER TABLE IF EXISTS ONLY public.input_items DROP CONSTRAINT IF EXISTS input_items_pkey;
ALTER TABLE IF EXISTS ONLY public.flow_plans DROP CONSTRAINT IF EXISTS flow_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.batches DROP CONSTRAINT IF EXISTS batches_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.unified_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.runs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.projects ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.input_sources ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.input_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.flow_plans ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.batches ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.unified_items_id_seq;
DROP TABLE IF EXISTS public.unified_items;
DROP SEQUENCE IF EXISTS public.settings_id_seq;
DROP TABLE IF EXISTS public.settings;
DROP SEQUENCE IF EXISTS public.runs_id_seq;
DROP TABLE IF EXISTS public.runs;
DROP SEQUENCE IF EXISTS public.rules_id_seq;
DROP TABLE IF EXISTS public.rules;
DROP SEQUENCE IF EXISTS public.projects_id_seq;
DROP TABLE IF EXISTS public.projects;
DROP SEQUENCE IF EXISTS public.input_sources_id_seq;
DROP TABLE IF EXISTS public.input_sources;
DROP SEQUENCE IF EXISTS public.input_items_id_seq;
DROP TABLE IF EXISTS public.input_items;
DROP SEQUENCE IF EXISTS public.flow_plans_id_seq;
DROP TABLE IF EXISTS public.flow_plans;
DROP SEQUENCE IF EXISTS public.batches_id_seq;
DROP TABLE IF EXISTS public.batches;
DROP TYPE IF EXISTS public."RuleType";
DROP TYPE IF EXISTS public."InputSourceType";
DROP TYPE IF EXISTS public."BatchState";
--
-- Name: BatchState; Type: TYPE; Schema: public; Owner: dev
--

CREATE TYPE public."BatchState" AS ENUM (
    'BATCH_CREATED',
    'DATA_FETCHED',
    'DATA_PARSED',
    'OUTPUT_CREATED',
    'OUTPUT_DELIVERED',
    'ITEMS_UNIFIED'
);


ALTER TYPE public."BatchState" OWNER TO dev;

--
-- Name: InputSourceType; Type: TYPE; Schema: public; Owner: dev
--

CREATE TYPE public."InputSourceType" AS ENUM (
    'TEST_MOCK_INPUT',
    'ENABLE_BANKING'
);


ALTER TYPE public."InputSourceType" OWNER TO dev;

--
-- Name: RuleType; Type: TYPE; Schema: public; Owner: dev
--

CREATE TYPE public."RuleType" AS ENUM (
    'INPUT_SOURCE',
    'FLOW'
);


ALTER TYPE public."RuleType" OWNER TO dev;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: batches; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.batches (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    number integer NOT NULL,
    state public."BatchState" NOT NULL,
    "flowPlanId" integer NOT NULL,
    completed timestamp(3) without time zone,
    data text
);


ALTER TABLE public.batches OWNER TO dev;

--
-- Name: batches_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.batches_id_seq OWNER TO dev;

--
-- Name: batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.batches_id_seq OWNED BY public.batches.id;


--
-- Name: flow_plans; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.flow_plans (
    id integer NOT NULL,
    title text NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    "projectId" integer NOT NULL,
    "lastStamp" timestamp(3) without time zone,
    state jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.flow_plans OWNER TO dev;

--
-- Name: flow_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.flow_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.flow_plans_id_seq OWNER TO dev;

--
-- Name: flow_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.flow_plans_id_seq OWNED BY public.flow_plans.id;


--
-- Name: input_items; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.input_items (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    data jsonb NOT NULL,
    "batchId" integer NOT NULL,
    "runId" integer NOT NULL,
    "flowPlanId" integer NOT NULL,
    skipped boolean NOT NULL,
    processed boolean NOT NULL,
    error text
);


ALTER TABLE public.input_items OWNER TO dev;

--
-- Name: input_items_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.input_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.input_items_id_seq OWNER TO dev;

--
-- Name: input_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.input_items_id_seq OWNED BY public.input_items.id;


--
-- Name: input_sources; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.input_sources (
    id integer NOT NULL,
    type public."InputSourceType" NOT NULL,
    "flowPlanId" integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.input_sources OWNER TO dev;

--
-- Name: input_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.input_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.input_sources_id_seq OWNER TO dev;

--
-- Name: input_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.input_sources_id_seq OWNED BY public.input_sources.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name text NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public.projects OWNER TO dev;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.projects_id_seq OWNER TO dev;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: rules; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.rules (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    priority integer DEFAULT 50 NOT NULL,
    type public."RuleType" NOT NULL,
    name text NOT NULL,
    "filterView" jsonb NOT NULL,
    "resultView" jsonb NOT NULL,
    "ownerId" integer NOT NULL,
    key text NOT NULL,
    filter jsonb NOT NULL,
    result jsonb NOT NULL
);


ALTER TABLE public.rules OWNER TO dev;

--
-- Name: rules_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rules_id_seq OWNER TO dev;

--
-- Name: rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.rules_id_seq OWNED BY public.rules.id;


--
-- Name: runs; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.runs (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    "initialState" public."BatchState" NOT NULL,
    "finalState" public."BatchState" NOT NULL,
    "batchId" integer NOT NULL,
    error text
);


ALTER TABLE public.runs OWNER TO dev;

--
-- Name: runs_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.runs_id_seq OWNER TO dev;

--
-- Name: runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.runs_id_seq OWNED BY public.runs.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    type public."InputSourceType" NOT NULL,
    url text,
    certificate text,
    "user" text,
    password text,
    options jsonb DEFAULT '{}'::jsonb NOT NULL,
    apikey text
);


ALTER TABLE public.settings OWNER TO dev;

--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.settings_id_seq OWNER TO dev;

--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: unified_items; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.unified_items (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    data jsonb NOT NULL,
    skipped boolean NOT NULL,
    "flowPlanId" integer NOT NULL,
    "batchId" integer NOT NULL,
    "runId" integer NOT NULL,
    "inputId" integer NOT NULL,
    error text,
    processed boolean NOT NULL
);


ALTER TABLE public.unified_items OWNER TO dev;

--
-- Name: unified_items_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.unified_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.unified_items_id_seq OWNER TO dev;

--
-- Name: unified_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.unified_items_id_seq OWNED BY public.unified_items.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    address text,
    zip text,
    city text,
    country text,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    password text NOT NULL,
    "lastSeen" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO dev;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO dev;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: batches id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.batches ALTER COLUMN id SET DEFAULT nextval('public.batches_id_seq'::regclass);


--
-- Name: flow_plans id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.flow_plans ALTER COLUMN id SET DEFAULT nextval('public.flow_plans_id_seq'::regclass);


--
-- Name: input_items id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.input_items ALTER COLUMN id SET DEFAULT nextval('public.input_items_id_seq'::regclass);


--
-- Name: input_sources id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.input_sources ALTER COLUMN id SET DEFAULT nextval('public.input_sources_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: rules id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.rules ALTER COLUMN id SET DEFAULT nextval('public.rules_id_seq'::regclass);


--
-- Name: runs id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.runs ALTER COLUMN id SET DEFAULT nextval('public.runs_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: unified_items id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.unified_items ALTER COLUMN id SET DEFAULT nextval('public.unified_items_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.batches (id, created, updated, number, state, "flowPlanId", completed, data) FROM stdin;
67	2024-04-08 15:13:52.536	2024-04-08 15:13:54.597	1	DATA_PARSED	1	\N	2000-01-01T12:00:00,Buy 5 ETH,-15000€\n2000-01-01T13:00:00,Sell 5 ETH,16000€\n
\.


--
-- Data for Name: flow_plans; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.flow_plans (id, title, created, updated, "projectId", "lastStamp", state) FROM stdin;
2	Enable Banking	2024-04-03 09:43:15.969	2024-04-04 07:41:52.793	1	\N	{"accountId": "effd5fa1-bea1-42fa-b887-de1d0eb4fd51", "sessionId": "3768ec99-5baf-4f3f-bbef-df7e95ce6b23", "validUntil": "2024-04-14T07:31:37.165000Z"}
1	Test Files	2024-03-30 14:39:53.161	2024-04-08 15:13:52.557	1	\N	{}
\.


--
-- Data for Name: input_items; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.input_items (id, created, updated, data, "batchId", "runId", "flowPlanId", skipped, processed, error) FROM stdin;
11	2024-04-08 15:13:54.588	2024-04-08 15:13:54.588	{"line": 1, "text": "Buy 5 ETH", "time": "2000-01-01T12:00:00", "total": -15000, "fields": {"word1": "Buy"}, "original": "2000-01-01T12:00:00,Buy 5 ETH,-15000€"}	67	336	1	f	f	\N
12	2024-04-08 15:13:54.593	2024-04-08 15:13:54.593	{"line": 2, "text": "Sell 5 ETH", "time": "2000-01-01T13:00:00", "total": 16000, "fields": {"word1": "Sell"}, "original": "2000-01-01T13:00:00,Sell 5 ETH,16000€"}	67	336	1	f	f	\N
\.


--
-- Data for Name: input_sources; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.input_sources (id, type, "flowPlanId", created, updated, settings) FROM stdin;
2	ENABLE_BANKING	2	2024-04-03 09:43:29.481	2024-04-03 13:48:13.014	{"iban": "FI7473834510057469", "country": "FI", "psuType": "personal", "bankName": "Nordea", "sessionInDays": 10}
1	TEST_MOCK_INPUT	1	2024-03-30 14:41:15.195	2024-04-08 09:21:37.735	{"url": "file:///testing/data/test.csv"}
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.projects (id, name, created, updated, "userId") FROM stdin;
1	Testing	2024-03-30 14:39:17.243	2024-03-30 14:39:03.459	1
2	Empty	2024-04-05 06:52:03.842	2024-04-05 06:51:51.04	1
\.


--
-- Data for Name: rules; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.rules (id, created, updated, priority, type, name, "filterView", "resultView", "ownerId", key, filter, result) FROM stdin;
\.


--
-- Data for Name: runs; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.runs (id, created, updated, "initialState", "finalState", "batchId", error) FROM stdin;
335	2024-04-08 15:13:52.548	2024-04-08 15:13:52.566	BATCH_CREATED	DATA_FETCHED	67	\N
336	2024-04-08 15:13:54.551	2024-04-08 15:13:54.601	DATA_FETCHED	DATA_PARSED	67	\N
337	2024-04-08 16:44:40.168	2024-04-08 16:44:40.23	DATA_PARSED	DATA_PARSED	67	PrismaClientKnownRequestError: \nInvalid `this.db.create()` invocation in\n/home/wigy/project/tasenor-data-exchange/backend/src/models/BaseModel.ts:101:32\n\n   98  * @returns New instance.\n   99  */\n  100 static async create<T extends MinimalModel, C extends BaseModel<T>>(data: Partial<T>): Promise<C> {\n→ 101   const item = await this.db.create(\nUnique constraint failed on the fields: (`type`,`ownerId`)\n    at In.handleRequestError (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/@prisma+client@5.11.0_prisma@5.11.0/node_modules/@prisma/client/runtime/library.js:122:6854)\n    at In.handleAndLogRequestError (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/@prisma+client@5.11.0_prisma@5.11.0/node_modules/@prisma/client/runtime/library.js:122:6188)\n    at In.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/@prisma+client@5.11.0_prisma@5.11.0/node_modules/@prisma/client/runtime/library.js:122:5896)\n    at async l (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/@prisma+client@5.11.0_prisma@5.11.0/node_modules/@prisma/client/runtime/library.js:127:10871)\n    at Function.create (/home/wigy/project/tasenor-data-exchange/backend/src/models/BaseModel.ts:101:18)\n    at TestMockInput.initializeRules (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:207:20)\n    at FlowPlanModel.unifyItems (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:171:15)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:63:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.settings (id, type, url, certificate, "user", password, options, apikey) FROM stdin;
1	ENABLE_BANKING	https://api.enablebanking.com/	-----BEGIN PRIVATE KEY-----\n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\ntOrma5H37YRxwdnXa84c0rcvFc6UXA==\n-----END PRIVATE KEY-----	\N	\N	{}	cfb2671e-6788-4d9b-878f-cb4fd7ab1077
2	TEST_MOCK_INPUT	\N	\N	\N	\N	{}	\N
\.


--
-- Data for Name: unified_items; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.unified_items (id, created, updated, data, skipped, "flowPlanId", "batchId", "runId", "inputId", error, processed) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.users (id, email, name, address, zip, city, country, created, updated, settings, password, "lastSeen") FROM stdin;
1	tommi.ronkainen@gmail.com	Tommi Ronkainen	Ahvenisjärventie 22	33720	Tampere	Finland	2024-03-30 14:38:56.726	2024-04-05 07:08:25.754	{"projectId": 1}	$2b$13$YAnqCS/Zsov6Bt5fR3phDelItsA6PpCLYl/kotccl5hAgbVojUQqC	\N
\.


--
-- Name: batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.batches_id_seq', 67, true);


--
-- Name: flow_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.flow_plans_id_seq', 2, true);


--
-- Name: input_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.input_items_id_seq', 12, true);


--
-- Name: input_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.input_sources_id_seq', 2, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.projects_id_seq', 2, true);


--
-- Name: rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.rules_id_seq', 18, true);


--
-- Name: runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.runs_id_seq', 337, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.settings_id_seq', 2, true);


--
-- Name: unified_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.unified_items_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (id);


--
-- Name: flow_plans flow_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.flow_plans
    ADD CONSTRAINT flow_plans_pkey PRIMARY KEY (id);


--
-- Name: input_items input_items_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.input_items
    ADD CONSTRAINT input_items_pkey PRIMARY KEY (id);


--
-- Name: input_sources input_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.input_sources
    ADD CONSTRAINT input_sources_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: rules rules_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_pkey PRIMARY KEY (id);


--
-- Name: runs runs_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT runs_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: unified_items unified_items_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.unified_items
    ADD CONSTRAINT unified_items_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: input_sources_flowPlanId_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "input_sources_flowPlanId_key" ON public.input_sources USING btree ("flowPlanId");


--
-- Name: rules_type_ownerId_name_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "rules_type_ownerId_name_key" ON public.rules USING btree (type, "ownerId", name);


--
-- Name: settings_type_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX settings_type_key ON public.settings USING btree (type);


--
-- Name: unified_items_inputId_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "unified_items_inputId_key" ON public.unified_items USING btree ("inputId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: batches batches_flowPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT "batches_flowPlanId_fkey" FOREIGN KEY ("flowPlanId") REFERENCES public.flow_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: flow_plans flow_plans_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.flow_plans
    ADD CONSTRAINT "flow_plans_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: input_items input_items_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.input_items
    ADD CONSTRAINT "input_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public.batches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: input_items input_items_flowPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.input_items
    ADD CONSTRAINT "input_items_flowPlanId_fkey" FOREIGN KEY ("flowPlanId") REFERENCES public.flow_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: input_items input_items_runId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.input_items
    ADD CONSTRAINT "input_items_runId_fkey" FOREIGN KEY ("runId") REFERENCES public.runs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: input_sources input_sources_flowPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.input_sources
    ADD CONSTRAINT "input_sources_flowPlanId_fkey" FOREIGN KEY ("flowPlanId") REFERENCES public.flow_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: projects projects_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: runs runs_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.runs
    ADD CONSTRAINT "runs_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public.batches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: unified_items unified_items_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.unified_items
    ADD CONSTRAINT "unified_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public.batches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: unified_items unified_items_flowPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.unified_items
    ADD CONSTRAINT "unified_items_flowPlanId_fkey" FOREIGN KEY ("flowPlanId") REFERENCES public.flow_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: unified_items unified_items_inputId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.unified_items
    ADD CONSTRAINT "unified_items_inputId_fkey" FOREIGN KEY ("inputId") REFERENCES public.input_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: unified_items unified_items_runId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.unified_items
    ADD CONSTRAINT "unified_items_runId_fkey" FOREIGN KEY ("runId") REFERENCES public.runs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--


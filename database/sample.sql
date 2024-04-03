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

ALTER TABLE IF EXISTS ONLY public.runs DROP CONSTRAINT IF EXISTS "runs_batchId_fkey";
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS "projects_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.input_sources DROP CONSTRAINT IF EXISTS "input_sources_flowPlanId_fkey";
ALTER TABLE IF EXISTS ONLY public.input_items DROP CONSTRAINT IF EXISTS "input_items_runId_fkey";
ALTER TABLE IF EXISTS ONLY public.input_items DROP CONSTRAINT IF EXISTS "input_items_flowPlanId_fkey";
ALTER TABLE IF EXISTS ONLY public.input_items DROP CONSTRAINT IF EXISTS "input_items_batchId_fkey";
ALTER TABLE IF EXISTS ONLY public.flow_plans DROP CONSTRAINT IF EXISTS "flow_plans_projectId_fkey";
ALTER TABLE IF EXISTS ONLY public.batches DROP CONSTRAINT IF EXISTS "batches_flowPlanId_fkey";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.settings_type_key;
DROP INDEX IF EXISTS public."input_sources_flowPlanId_key";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE IF EXISTS ONLY public.runs DROP CONSTRAINT IF EXISTS runs_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.input_sources DROP CONSTRAINT IF EXISTS input_sources_pkey;
ALTER TABLE IF EXISTS ONLY public.input_items DROP CONSTRAINT IF EXISTS input_items_pkey;
ALTER TABLE IF EXISTS ONLY public.flow_plans DROP CONSTRAINT IF EXISTS flow_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.batches DROP CONSTRAINT IF EXISTS batches_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.runs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.projects ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.input_sources ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.input_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.flow_plans ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.batches ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.settings_id_seq;
DROP TABLE IF EXISTS public.settings;
DROP SEQUENCE IF EXISTS public.runs_id_seq;
DROP TABLE IF EXISTS public.runs;
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
    'OUTPUT_DELIVERED'
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
    processed boolean NOT NULL,
    success boolean NOT NULL,
    "batchId" integer NOT NULL,
    "runId" integer NOT NULL,
    "flowPlanId" integer NOT NULL
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
    url text NOT NULL,
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
    last_seen timestamp(3) without time zone,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL
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
-- Name: runs id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.runs ALTER COLUMN id SET DEFAULT nextval('public.runs_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.batches (id, created, updated, number, state, "flowPlanId", completed, data) FROM stdin;
50	2024-04-03 10:17:49.847	2024-04-03 10:17:49.847	1	BATCH_CREATED	2	\N	\N
51	2024-04-03 16:17:46.517	2024-04-03 16:17:46.517	1	BATCH_CREATED	1	\N	\N
\.


--
-- Data for Name: flow_plans; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.flow_plans (id, title, created, updated, "projectId", "lastStamp", state) FROM stdin;
1	Test Files	2024-03-30 14:39:53.161	2024-04-02 12:46:43.93	1	\N	{}
2	Enable Banking	2024-04-03 09:43:15.969	2024-04-03 09:41:34.896	1	\N	{}
\.


--
-- Data for Name: input_items; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.input_items (id, created, updated, data, processed, success, "batchId", "runId", "flowPlanId") FROM stdin;
\.


--
-- Data for Name: input_sources; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.input_sources (id, type, url, "flowPlanId", created, updated, settings) FROM stdin;
1	TEST_MOCK_INPUT	file:///test/data/test.csv	1	2024-03-30 14:41:15.195	2024-04-02 17:06:29.167	{"url": "file:///test/data/test.csv"}
2	ENABLE_BANKING		2	2024-04-03 09:43:29.481	2024-04-03 13:48:13.014	{"iban": "FI7473834510057469", "country": "FI", "psuType": "personal", "bankName": "Nordea", "sessionInDays": 10}
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.projects (id, name, created, updated, "userId") FROM stdin;
1	Testing	2024-03-30 14:39:17.243	2024-03-30 14:39:03.459	1
\.


--
-- Data for Name: runs; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.runs (id, created, updated, "initialState", "finalState", "batchId", error) FROM stdin;
133	2024-04-03 10:24:38.924	2024-04-03 10:24:38.948	BATCH_CREATED	BATCH_CREATED	50	TypeError: driver.autheticate is not a function\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:81:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:40:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:21:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:46:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
134	2024-04-03 10:25:01.918	2024-04-03 10:25:01.928	BATCH_CREATED	BATCH_CREATED	50	Error: Input source ENABLE_BANKING does not implement autheticate().\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:39:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:81:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:40:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:21:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:46:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
135	2024-04-03 10:46:04.593	2024-04-03 10:46:04.609	BATCH_CREATED	BATCH_CREATED	50	Error: Input source ENABLE_BANKING does not implement autheticate().\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:39:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:81:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:40:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:21:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:47:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
136	2024-04-03 10:48:06.057	2024-04-03 10:48:06.08	BATCH_CREATED	BATCH_CREATED	50	Error: Input source ENABLE_BANKING does not implement autheticate().\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:39:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:81:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:40:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:21:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:47:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
137	2024-04-03 10:50:45.713	2024-04-03 10:50:45.731	BATCH_CREATED	BATCH_CREATED	50	Error: Input source ENABLE_BANKING does not implement autheticate().\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:39:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:82:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
129	2024-04-03 10:17:49.861	2024-04-03 10:17:49.876	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:17:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:80:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:40:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:21:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:46:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
130	2024-04-03 10:17:54.53	2024-04-03 10:17:54.553	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:17:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:80:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:40:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:21:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:46:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
131	2024-04-03 10:23:12.895	2024-04-03 10:23:12.918	BATCH_CREATED	BATCH_CREATED	50	TypeError: driver.autheticate is not a function\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:81:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:40:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:21:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:46:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
132	2024-04-03 10:24:18.175	2024-04-03 10:24:18.194	BATCH_CREATED	BATCH_CREATED	50	TypeError: driver.autheticate is not a function\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:81:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:40:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:21:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:46:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
138	2024-04-03 10:55:40.974	2024-04-03 10:55:41.007	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:21:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
139	2024-04-03 10:55:55.352	2024-04-03 10:55:55.366	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:21:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
140	2024-04-03 11:00:46.292	2024-04-03 11:00:46.319	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:39:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
141	2024-04-03 11:00:53.546	2024-04-03 11:00:53.575	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:37:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
142	2024-04-03 11:04:17.831	2024-04-03 11:04:17.863	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:48:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
143	2024-04-03 11:06:02.678	2024-04-03 11:06:02.715	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:48:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
144	2024-04-03 11:08:27.196	2024-04-03 11:08:27.226	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:48:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
145	2024-04-03 11:08:51.277	2024-04-03 11:08:51.308	BATCH_CREATED	BATCH_CREATED	50	Error: Setting 'apiKey' is not set for system settings 'ENABLE_BANKING'.\n    at SettingsModel.get apiKey (/home/wigy/project/tasenor-data-exchange/backend/src/models/SettingsModel.ts:15:13)\n    at EnableBankingInput.jwt (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:42:37)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:50:22)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
146	2024-04-03 11:08:58.979	2024-04-03 11:08:59.011	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:55:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
147	2024-04-03 11:10:17.026	2024-04-03 11:10:17.058	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:58:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
148	2024-04-03 11:15:00.817	2024-04-03 11:15:00.844	BATCH_CREATED	BATCH_CREATED	50	Error: Incalud setting 'apiKey' queried for system settings of 'ENABLE_BANKING'.\n    at SettingsModel.getOrThrow (/home/wigy/project/tasenor-data-exchange/backend/src/models/SettingsModel.ts:15:13)\n    at SettingsModel.get apiKey (/home/wigy/project/tasenor-data-exchange/backend/src/models/SettingsModel.ts:25:17)\n    at EnableBankingInput.jwt (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:41:32)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:54:22)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
157	2024-04-03 11:28:05.419	2024-04-03 11:28:05.449	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:56:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
149	2024-04-03 11:15:53.244	2024-04-03 11:15:53.272	BATCH_CREATED	BATCH_CREATED	50	Error: Invalid setting 'apiKey' queried for system settings of 'ENABLE_BANKING'.\n    at SettingsModel.getOrThrow (/home/wigy/project/tasenor-data-exchange/backend/src/models/SettingsModel.ts:15:13)\n    at SettingsModel.get apiKey (/home/wigy/project/tasenor-data-exchange/backend/src/models/SettingsModel.ts:25:17)\n    at EnableBankingInput.jwt (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:41:32)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:54:22)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
150	2024-04-03 11:16:01.702	2024-04-03 11:16:01.737	BATCH_CREATED	BATCH_CREATED	50	Error: Invalid setting 'apiKey' queried for system settings of 'ENABLE_BANKING'.\n    at SettingsModel.getOrThrow (/home/wigy/project/tasenor-data-exchange/backend/src/models/SettingsModel.ts:16:13)\n    at SettingsModel.get apiKey (/home/wigy/project/tasenor-data-exchange/backend/src/models/SettingsModel.ts:26:17)\n    at EnableBankingInput.jwt (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:41:32)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:54:22)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
151	2024-04-03 11:16:12.464	2024-04-03 11:16:12.495	BATCH_CREATED	BATCH_CREATED	50	Error: Invalid setting 'apiKey' queried for system settings of 'ENABLE_BANKING'.\n    at SettingsModel.getOrThrow (/home/wigy/project/tasenor-data-exchange/backend/src/models/SettingsModel.ts:16:13)\n    at SettingsModel.get apiKey (/home/wigy/project/tasenor-data-exchange/backend/src/models/SettingsModel.ts:26:17)\n    at EnableBankingInput.jwt (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:41:32)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:54:22)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
152	2024-04-03 11:16:56.488	2024-04-03 11:16:56.519	BATCH_CREATED	BATCH_CREATED	50	Error: Setting 'apikey' is not set for system settings of 'ENABLE_BANKING'.\n    at SettingsModel.getOrThrow (/home/wigy/project/tasenor-data-exchange/backend/src/models/SettingsModel.ts:18:13)\n    at SettingsModel.get apikey (/home/wigy/project/tasenor-data-exchange/backend/src/models/SettingsModel.ts:25:17)\n    at EnableBankingInput.jwt (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:41:32)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:54:22)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
153	2024-04-03 11:17:12.087	2024-04-03 11:17:12.136	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:59:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
154	2024-04-03 11:17:32.69	2024-04-03 11:17:32.737	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:60:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
155	2024-04-03 11:23:05.086	2024-04-03 11:23:05.103	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:62:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
156	2024-04-03 11:24:51.414	2024-04-03 11:24:51.451	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:61:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
158	2024-04-03 11:28:30.916	2024-04-03 11:28:30.944	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:56:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
159	2024-04-03 11:29:32.413	2024-04-03 11:29:32.442	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:56:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
160	2024-04-03 11:29:45.156	2024-04-03 11:29:45.178	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:56:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
161	2024-04-03 11:30:56.28	2024-04-03 11:30:56.301	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:56:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
162	2024-04-03 11:33:01.937	2024-04-03 11:33:02.066	BATCH_CREATED	BATCH_CREATED	50	Error: connect ECONNREFUSED 127.0.0.1:80\n    at Function.AxiosError.from (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/AxiosError.js:89:14)\n    at RedirectableRequest.handleRequestError (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:610:25)\n    at RedirectableRequest.emit (node:events:517:28)\n    at RedirectableRequest.emit (node:domain:489:12)\n    at eventHandlers.<computed> (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/follow-redirects@1.15.6/node_modules/follow-redirects/index.js:38:24)\n    at ClientRequest.emit (node:events:517:28)\n    at ClientRequest.emit (node:domain:489:12)\n    at Socket.socketErrorListener (node:_http_client:501:9)\n    at Socket.emit (node:events:517:28)\n    at Socket.emit (node:domain:489:12)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:87:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:51:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
163	2024-04-03 11:33:35.53	2024-04-03 11:33:35.558	BATCH_CREATED	BATCH_CREATED	50	ReferenceError: log is not defined\n    at EnableBankingInput.request (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:76:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:88:29)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:51:16)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
164	2024-04-03 11:33:44.168	2024-04-03 11:33:44.252	BATCH_CREATED	BATCH_CREATED	50	Error: connect ECONNREFUSED 127.0.0.1:80\n    at Function.AxiosError.from (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/AxiosError.js:89:14)\n    at RedirectableRequest.handleRequestError (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:610:25)\n    at RedirectableRequest.emit (node:events:517:28)\n    at RedirectableRequest.emit (node:domain:489:12)\n    at eventHandlers.<computed> (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/follow-redirects@1.15.6/node_modules/follow-redirects/index.js:38:24)\n    at ClientRequest.emit (node:events:517:28)\n    at ClientRequest.emit (node:domain:489:12)\n    at Socket.socketErrorListener (node:_http_client:501:9)\n    at Socket.emit (node:events:517:28)\n    at Socket.emit (node:domain:489:12)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:88:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:51:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
165	2024-04-03 11:34:15.254	2024-04-03 11:34:15.64	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 401\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:88:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:51:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
166	2024-04-03 11:35:59.983	2024-04-03 11:36:00.351	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 401\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:90:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:51:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
167	2024-04-03 11:37:06.03	2024-04-03 11:37:06.636	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 401\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:90:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:51:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
168	2024-04-03 11:37:49.857	2024-04-03 11:37:50.314	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 401\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:90:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:51:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
189	2024-04-03 12:53:10.052	2024-04-03 12:53:10.672	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:76:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
195	2024-04-03 13:04:40.904	2024-04-03 13:04:40.935	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:86:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
169	2024-04-03 11:38:22.645	2024-04-03 11:38:23.109	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 401\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:90:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:50:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
170	2024-04-03 11:38:48.757	2024-04-03 11:38:49.088	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:55:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
171	2024-04-03 11:39:15.719	2024-04-03 11:39:16.135	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:55:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
172	2024-04-03 11:40:07.415	2024-04-03 11:40:07.776	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:55:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
173	2024-04-03 11:40:18.864	2024-04-03 11:40:19.207	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:55:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
174	2024-04-03 11:40:36.744	2024-04-03 11:40:37.072	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:55:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
175	2024-04-03 11:40:45.443	2024-04-03 11:40:45.949	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:55:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
190	2024-04-03 12:53:15.617	2024-04-03 12:53:16.286	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:76:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
192	2024-04-03 12:59:41.872	2024-04-03 12:59:42.737	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:83:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
176	2024-04-03 11:41:41.279	2024-04-03 11:41:41.715	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 401\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:93:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:50:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
177	2024-04-03 11:44:17.011	2024-04-03 11:44:17.449	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 401\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:93:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:50:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
178	2024-04-03 11:45:19.843	2024-04-03 11:45:20.185	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 401\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:93:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:49:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
179	2024-04-03 11:46:11.755	2024-04-03 11:46:12.13	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 401\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:93:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:49:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
191	2024-04-03 12:55:52.409	2024-04-03 12:55:52.431	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:77:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
194	2024-04-03 13:03:10.197	2024-04-03 13:03:10.213	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:84:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
180	2024-04-03 11:46:38.358	2024-04-03 11:46:38.717	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 401\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.GET (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:93:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:49:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
181	2024-04-03 11:48:13.796	2024-04-03 11:48:14.232	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:54:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
182	2024-04-03 11:48:51.246	2024-04-03 11:48:51.597	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:54:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
183	2024-04-03 12:28:13.289	2024-04-03 12:28:13.831	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:55:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
184	2024-04-03 12:28:58.143	2024-04-03 12:28:58.638	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:55:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
185	2024-04-03 12:41:17.685	2024-04-03 12:41:17.712	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:58:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
186	2024-04-03 12:41:20.67	2024-04-03 12:41:20.701	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:58:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
187	2024-04-03 12:43:27.299	2024-04-03 12:43:27.329	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:58:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
188	2024-04-03 12:49:13.174	2024-04-03 12:49:13.2	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:74:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:51:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
193	2024-04-03 12:59:58.254	2024-04-03 12:59:58.254	BATCH_CREATED	BATCH_CREATED	50	\N
196	2024-04-03 13:05:20.578	2024-04-03 13:05:20.607	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:89:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
197	2024-04-03 13:08:12.061	2024-04-03 13:08:12.17	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:91:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
198	2024-04-03 13:08:18.828	2024-04-03 13:08:19.226	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 422\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.POST (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:106:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:81:18)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
199	2024-04-03 13:08:47.805	2024-04-03 13:08:48.269	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 422\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.POST (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:106:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:81:18)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
200	2024-04-03 13:10:04.828	2024-04-03 13:10:05.219	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 404\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.DELETE (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:106:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:82:18)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
201	2024-04-03 13:11:05.715	2024-04-03 13:11:05.715	BATCH_CREATED	BATCH_CREATED	50	\N
202	2024-04-03 13:11:35.044	2024-04-03 13:11:35.811	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:92:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
213	2024-04-03 14:01:31.197	2024-04-03 14:01:33.119	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:95:11)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:85:18)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
203	2024-04-03 13:17:56.885	2024-04-03 13:17:57.337	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 422\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.POST (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:114:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:81:57)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
204	2024-04-03 13:18:04.288	2024-04-03 13:18:04.288	BATCH_CREATED	BATCH_CREATED	50	\N
205	2024-04-03 13:18:35.789	2024-04-03 13:18:38.565	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:93:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:84:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
206	2024-04-03 13:18:43.722	2024-04-03 13:18:44.134	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 422\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.POST (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:114:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:81:57)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
207	2024-04-03 13:43:56.417	2024-04-03 13:43:56.417	BATCH_CREATED	BATCH_CREATED	50	\N
208	2024-04-03 13:44:29.914	2024-04-03 13:44:30.735	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:92:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:85:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
209	2024-04-03 13:54:37.052	2024-04-03 13:54:37.052	BATCH_CREATED	BATCH_CREATED	50	\N
210	2024-04-03 13:55:05.954	2024-04-03 13:55:07.207	BATCH_CREATED	BATCH_CREATED	50	Error: TODO: FETCH\n    at EnableBankingInput.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:97:11)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:85:31)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
211	2024-04-03 14:00:54.797	2024-04-03 14:00:55.221	BATCH_CREATED	BATCH_CREATED	50	AxiosError: Request failed with status code 422\n    at settle (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/settle.js:19:12)\n    at IncomingMessage.handleStreamEnd (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/adapters/http.js:589:11)\n    at IncomingMessage.emit (node:events:529:35)\n    at IncomingMessage.emit (node:domain:489:12)\n    at endReadableNT (node:internal/streams/readable:1400:12)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/wigy/project/tasenor-data-exchange/backend/node_modules/.pnpm/axios@1.6.8/node_modules/axios/lib/core/Axios.js:45:41)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at EnableBankingInput.POST (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:114:18)\n    at EnableBankingInput.autheticate (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/EnableBankingInput.ts:81:57)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:83:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
212	2024-04-03 14:01:03.28	2024-04-03 14:01:03.28	BATCH_CREATED	BATCH_CREATED	50	\N
214	2024-04-03 16:17:46.521	2024-04-03 16:17:46.543	BATCH_CREATED	BATCH_CREATED	51	Error: Cannot find settings for TEST_MOCK_INPUT.\n    at Function.get (/home/wigy/project/tasenor-data-exchange/backend/src/models/SettingsModel.ts:39:13)\n    at TestMockInput.initialize (/home/wigy/project/tasenor-data-exchange/backend/src/engine/source/InputSource.ts:128:27)\n    at FlowPlanModel.fetchData (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:82:5)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:41:22)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:22:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:54:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.settings (id, type, url, certificate, "user", password, options, apikey) FROM stdin;
1	ENABLE_BANKING	https://api.enablebanking.com/	-----BEGIN PRIVATE KEY-----\nMIIJQgIBADANBgkqhkiG9w0BAQEFAASCCSwwggkoAgEAAoICAQDHSFZns2VOnL1h\nHqqhMnQTpNfdATap6OYcFayrOnVxLZUFRRDfxsC5eHaMX33fG+wcRMVDk/dRyYSQ\nU9YGQBnUgenqBP7PvLp7Rzd854xEH9Z1KRsnrOu+scWbukTd+Z+1DOPNmoTOzTLr\npjK5xzPIXzM09KUV1DjKN7YhviRWmF8IATSepb2cMwsuw0x4H+1DSqF7AEFD/rez\nkYcz+78pRhFV7RPMGH3y28XDg9D/PfqA3dadyzf+eQNZmyFi0uxAt8UCnb1fw2Ml\nD8BEdXgFIT3Ph3XTK1eP7oi1DyQP0f/YUUnP0wPj/g+rViPsvRT67e+4BezNnGaC\n049W1xxMUzU6VqljTu90epOqSxBRvSNZEtEunjGkXttFw8MQdbLai8Il5ngD3D+z\ntOvNNB5fAsg9ah2yOYrII29XVMdN+sd1tNVWZtXCuPG7vcwjGzlAYyVgDlxcQzSh\njKx44ySUq/CGbjHm6frttI8Y2ksTPGsWt/gPnhQJ8zLl0tXwq6jt5h96i1nCQ8oN\njH0jQyOg29qBIjUXDyJB1hLH0O3I0mw93yHFZ/Jif2WS/C04r2qI7+fmEzQPtt/V\nZETkswTCeDvmwvqR+SYxfb8FmPRB1MAtP/Jyh4M21DoFLLCt/i0PyMFx5CJKPnKP\nWc/+AwYJybt2/oiNTy1vqcmess7/WQIDAQABAoICACVGdBcImMn4CnpYlJz7RXgJ\nLPFjUTi93hDhwv7yO9Z0KrwmG45n7FOk4zPFhtNNM0BkYquNyUSMl5WxgMaBhfNY\na4sA7TKpQA5gF1JvMy7o76HRkwk8UIpGUUqcMFZ+4y8n3pJuNSpDeqNWXoWea6Ku\nn/LnUdu/6vF0M0ajfMOP07K5GwETymAlshFIqYyMmEIuev75YLvZsL3PWkVQcQTE\n3OhAJKRX7nMXRaoZBWZAzxL8q7CvOuWH+CbyG/ASuOswFJM1Mx9u+iQMCrAjctQu\n0BN56IGbyVCcUwje8KVe5+ar6c0MUN17/61SOv0EryBykhTPUuhwuUH+VYDuUpXl\npfYlmqcuxG1JoiP12CWu/FtlvWeibvnkQoQ+lwvDcar40Q6Wo0y1QCyJKRv4Q+u0\naPdXm0fVi7JVLS365Xwkcztn+ODMB10d5dHFByC69nzbCwcBhFj/i4cU6jWjQOeL\nL9SCH9dLni0sVQ6Ju3POYNkzGNqgRk6Sn1Qe/0YQhh4B1iGmrJpbXHqWXftNtoYT\naWqXGtdXXi9fMYl0s1QMBl7pgt0A5ZVrlagV2pcPaQDfj00Sp1Tv1sqoNTBwRzjJ\ngTSTYIqUTRvyVEMpSTUWS2UA/EtXGcjenM+PvsUcHQhHvHBGRBtiLwclBkfFCz2k\na8ieDqS9sJmLG7EsSPgbAoIBAQDrmomGb3qiDbYLNS8+lCKg3j/mL+KKw8t0LNBH\nHe5kUOgBn909A5E/BSlW4bGnrTJw/UgafisyAnizd2xJqS3vNBmnfUAUWHL9IwGA\nNR5ROu8/pw4j4V/kAR8RCZVPj1BGaaXFR3fHHsvQrdReatNBFIZTWuuX+d4zBO0M\nO5U/lMmoQQMZpB4qxHDEdevz5bbaGjuX2a8hfdRQmXPbH9KQDNj6CtKJjI2dXqmZ\nGgJTHssaoYHx6iL05rKhYqMfizT6LteqrAMDJ0k1ESDeesMeSPmy6jPPZCAt3Ww6\nE1ZoA6m0ynpCN3kdNzGJn8+6qr6Cqv4CyXEyjp888QYm8nJrAoIBAQDYiNmbnU7m\nzME+G0E7s0t/rKQZfpdqmCkwFvBXlM4l3Dt5tV47ASnq8u9/vgwbnxZHqdJEXUlN\nMEn9TAs+gI8AHPwRQ6WoaUKiXMNOpLZ+uY/Z3wfCADjXmrPk+hOL7avPQzNb+/UA\nBDOhZy96wkgGhJxG3+kz7rHYTVK+03jclaZWEe8kT2Jrg9qkM37yOwFYcEGv4CnO\nWQ3rXcTknIvnH8DI3CFO4n/Pgx98RG0QlN6ZEyFAbZIuusHHSHJEPVV3vo5rc7Na\niQaDllD0u1Uvmb8w01HJu+nbYY27bFI7fkAgit0jNZOciknmVjFojFsamDQyUezA\nZvzfDYeUOO5LAoIBAGh0m4R+6F/wtEVDzy5vfurTnoDvugDLzegz9iORoZ/YPwR5\nXB0w97R5FVrvtVQh9bsikFUumvgRIHJxABGocDUdZEJdxYs/q7uPSZsN8eMRvgD6\nj8pYoar01FE5bnlXkL+nF1ff17rwbGyYpQ83TXINJ4DNTqaSoXD9PhuuTv1hegae\nzEESAk3zygtQPMxljCwmdUVdvcebggY6AqOj+Dble01gfvd82UxsK8U1QtKXVHT6\nJiKbK+RoY8opcSkLDvHc0sFYgf1j7ZEZhvkcdGV49TvdmhrYyWuMP+9/o096UENX\ngdzZu1i4n73knLSl/tDv/q49oXJIyVC7i364/wECggEAWH286KKmHx5ojtgWla5V\nWW0VdzHL8Y0TsAp/2FsA0GoriDa9tsFn/xOfGwZw7kzajxjwzG2PSlNEuZZ9NeLW\nDgbKYMfTiHrT94SPcLFRv4JYLoK+KeNrV3lqsVYd7N6Ji198OshCPOp6qyh/N9z0\nEG3ba/+Pz2BqH+qhuUi1KPijjKMxpxYmM6gkD1zYMWg5yYm+3oButVyhmqGsmHz9\nk8vfPnbvycw4zXZZxLA2HkOooMg3m5vr1NsP3EBYKlkid5hRncof7wz2s4oXtZxl\nWNmtT+fckeQQ004P3RuMk7GpxWLassvvclb1koOBF6fch4bSNgpTBeJQz1s5IDMP\n9wKCAQEA1B8td34SOg0FsLMWcN/s4DTMYTZ3kPF8/n8/0PAZCKYmveaITM9Bk40f\nfvZlvsyXsazcYj2bvFFjVZHt8dxnwJ33XxRmgdwjhGVFc9uEKjh12YvAPs/eIWcR\n0dVc4rtPBQlMqZJ7oJi2ejMOIA8kRpOqYCRPHWRrZIwjppWqVipP8XtWbx9bF6MT\nCr9KECeX/7votcm3GutcxqYx8bl+J9w5ZStRlY548/Cc0sz9c9/EXn/OMk7nphKW\noLqUUI8gKAOFH0R0Wm56NKlCsr2FQRnSN4oQwzGyd2NoNIHVIL8LPDsU+MkHv1DW\ntOrma5H37YRxwdnXa84c0rcvFc6UXA==\n-----END PRIVATE KEY-----	\N	\N	{}	cfb2671e-6788-4d9b-878f-cb4fd7ab1077
2	TEST_MOCK_INPUT	\N	\N	\N	\N	{}	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.users (id, email, name, address, zip, city, country, last_seen, created, updated, settings) FROM stdin;
1	tommi.ronkainen@gmail.com	Tommi Ronkainen	Ahvenisjärventie 22	33720	Tampere	Finland	\N	2024-03-30 14:38:56.726	2024-03-30 14:38:12.548	{}
\.


--
-- Name: batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.batches_id_seq', 51, true);


--
-- Name: flow_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.flow_plans_id_seq', 2, true);


--
-- Name: input_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.input_items_id_seq', 1, false);


--
-- Name: input_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.input_sources_id_seq', 2, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.projects_id_seq', 1, true);


--
-- Name: runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.runs_id_seq', 214, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.settings_id_seq', 2, true);


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
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: input_sources_flowPlanId_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "input_sources_flowPlanId_key" ON public.input_sources USING btree ("flowPlanId");


--
-- Name: settings_type_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX settings_type_key ON public.settings USING btree (type);


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
-- PostgreSQL database dump complete
--


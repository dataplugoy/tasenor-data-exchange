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
    settings jsonb DEFAULT '{}'::jsonb NOT NULL
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
    options jsonb DEFAULT '{}'::jsonb NOT NULL
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
48	2024-04-02 18:55:11.851	2024-04-02 18:55:11.871	1	DATA_FETCHED	1	\N	2000-01-01T12:00:00,Buy 5 ETH,-15000€\n2000-01-01T13:00:00,Sell 5 ETH,16000€\n
\.


--
-- Data for Name: flow_plans; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.flow_plans (id, title, created, updated, "projectId", "lastStamp", settings) FROM stdin;
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
2	ENABLE_BANKING		2	2024-04-03 09:43:29.481	2024-04-03 09:44:57.769	{}
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
122	2024-04-02 18:55:11.863	2024-04-02 18:55:11.873	BATCH_CREATED	DATA_FETCHED	48	\N
123	2024-04-03 09:40:01.222	2024-04-03 09:40:01.239	DATA_FETCHED	DATA_FETCHED	48	Error: Function not yet implemented for state DATA_FETCHED.\n    at FlowPlanModel.notImplemented (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:71:11)\n    at Object.DATA_FETCHED (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:18:35)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:40:54)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:21:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:46:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
124	2024-04-03 09:40:14.041	2024-04-03 09:40:14.055	DATA_FETCHED	DATA_FETCHED	48	Error: Function not yet implemented for state DATA_FETCHED.\n    at FlowPlanModel.notImplemented (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:71:11)\n    at Object.DATA_FETCHED (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:18:35)\n    at FlowPlanModel.run (/home/wigy/project/tasenor-data-exchange/backend/src/models/FlowPlanModel.ts:40:54)\n    at Object.run (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:21:3)\n    at Object.execute (/home/wigy/project/tasenor-data-exchange/backend/src/engine/cli.ts:46:3)\n    at async file:///home/wigy/project/tasenor-data-exchange/bin/tadex.mjs:4:1
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.settings (id, type, url, certificate, "user", password, options) FROM stdin;
1	ENABLE_BANKING	https://api.enablebanking.com/	-----BEGIN PRIVATE KEY----- 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 tOrma5H37YRxwdnXa84c0rcvFc6UXA== -----END PRIVATE KEY-----	\N	\N	{}
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

SELECT pg_catalog.setval('public.batches_id_seq', 48, true);


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

SELECT pg_catalog.setval('public.runs_id_seq', 124, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.settings_id_seq', 1, true);


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


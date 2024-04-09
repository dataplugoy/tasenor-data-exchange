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
ALTER TABLE IF EXISTS ONLY public.output_items DROP CONSTRAINT IF EXISTS "output_items_unifiedId_fkey";
ALTER TABLE IF EXISTS ONLY public.output_items DROP CONSTRAINT IF EXISTS "output_items_runId_fkey";
ALTER TABLE IF EXISTS ONLY public.output_items DROP CONSTRAINT IF EXISTS "output_items_flowPlanId_fkey";
ALTER TABLE IF EXISTS ONLY public.output_items DROP CONSTRAINT IF EXISTS "output_items_batchId_fkey";
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
DROP INDEX IF EXISTS public."output_items_unifiedId_key";
DROP INDEX IF EXISTS public."input_sources_flowPlanId_key";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.unified_items DROP CONSTRAINT IF EXISTS unified_items_pkey;
ALTER TABLE IF EXISTS ONLY public.settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE IF EXISTS ONLY public.runs DROP CONSTRAINT IF EXISTS runs_pkey;
ALTER TABLE IF EXISTS ONLY public.rules DROP CONSTRAINT IF EXISTS rules_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.output_items DROP CONSTRAINT IF EXISTS output_items_pkey;
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
ALTER TABLE IF EXISTS public.output_items ALTER COLUMN id DROP DEFAULT;
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
DROP SEQUENCE IF EXISTS public.output_items_id_seq;
DROP TABLE IF EXISTS public.output_items;
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
    data text,
    "endStock" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "initialStock" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "lastStamp" timestamp(3) without time zone
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
    state jsonb DEFAULT '{}'::jsonb NOT NULL,
    stock jsonb DEFAULT '{}'::jsonb NOT NULL
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
-- Name: output_items; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.output_items (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    data jsonb NOT NULL,
    processed boolean NOT NULL,
    skipped boolean NOT NULL,
    error text,
    "unifiedId" integer NOT NULL,
    "flowPlanId" integer NOT NULL,
    "batchId" integer NOT NULL,
    "runId" integer NOT NULL,
    delivered boolean NOT NULL,
    "stockChange" jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.output_items OWNER TO dev;

--
-- Name: output_items_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.output_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.output_items_id_seq OWNER TO dev;

--
-- Name: output_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.output_items_id_seq OWNED BY public.output_items.id;


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
    processed boolean NOT NULL,
    "time" timestamp(3) without time zone NOT NULL
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
-- Name: output_items id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.output_items ALTER COLUMN id SET DEFAULT nextval('public.output_items_id_seq'::regclass);


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

COPY public.batches (id, created, updated, number, state, "flowPlanId", completed, data, "endStock", "initialStock", "lastStamp") FROM stdin;
\.


--
-- Data for Name: flow_plans; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.flow_plans (id, title, created, updated, "projectId", "lastStamp", state, stock) FROM stdin;
1	Unit Testing	2024-03-30 14:39:53.161	2024-04-09 08:48:44.034	1	\N	{}	{}
\.


--
-- Data for Name: input_items; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.input_items (id, created, updated, data, "batchId", "runId", "flowPlanId", skipped, processed, error) FROM stdin;
\.


--
-- Data for Name: input_sources; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.input_sources (id, type, "flowPlanId", created, updated, settings) FROM stdin;
1	TEST_MOCK_INPUT	1	2024-03-30 14:41:15.195	2024-04-02 17:06:29.167	{"url": "file:///testing/data/test.csv"}
\.


--
-- Data for Name: output_items; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.output_items (id, created, updated, data, processed, skipped, error, "unifiedId", "flowPlanId", "batchId", "runId", delivered, "stockChange") FROM stdin;
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
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.settings (id, type, url, certificate, "user", password, options, apikey) FROM stdin;
2	TEST_MOCK_INPUT	\N	\N	\N	\N	{}	\N
\.


--
-- Data for Name: unified_items; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.unified_items (id, created, updated, data, skipped, "flowPlanId", "batchId", "runId", "inputId", error, processed, "time") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.users (id, email, name, address, zip, city, country, created, updated, settings, password, "lastSeen") FROM stdin;
1	test@localhost	Test User	Road 66	12345-FI	Tampere	Finland	2024-03-30 14:38:56.726	2024-04-05 10:46:46.293	{"projectId": 1}	$2b$13$YAnqCS/Zsov6Bt5fR3phDelItsA6PpCLYl/kotccl5hAgbVojUQqC	\N
\.


--
-- Name: batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.batches_id_seq', 63, true);


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
-- Name: output_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.output_items_id_seq', 1, false);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.projects_id_seq', 2, true);


--
-- Name: rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.rules_id_seq', 20, true);


--
-- Name: runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.runs_id_seq', 289, true);


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
-- Name: output_items output_items_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.output_items
    ADD CONSTRAINT output_items_pkey PRIMARY KEY (id);


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
-- Name: output_items_unifiedId_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "output_items_unifiedId_key" ON public.output_items USING btree ("unifiedId");


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
-- Name: output_items output_items_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.output_items
    ADD CONSTRAINT "output_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public.batches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: output_items output_items_flowPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.output_items
    ADD CONSTRAINT "output_items_flowPlanId_fkey" FOREIGN KEY ("flowPlanId") REFERENCES public.flow_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: output_items output_items_runId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.output_items
    ADD CONSTRAINT "output_items_runId_fkey" FOREIGN KEY ("runId") REFERENCES public.runs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: output_items output_items_unifiedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.output_items
    ADD CONSTRAINT "output_items_unifiedId_fkey" FOREIGN KEY ("unifiedId") REFERENCES public.unified_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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


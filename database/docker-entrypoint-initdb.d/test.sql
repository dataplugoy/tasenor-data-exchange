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
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS "services_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.runs DROP CONSTRAINT IF EXISTS "runs_batchId_fkey";
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS "projects_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.output_items DROP CONSTRAINT IF EXISTS "output_items_unifiedId_fkey";
ALTER TABLE IF EXISTS ONLY public.output_items DROP CONSTRAINT IF EXISTS "output_items_runId_fkey";
ALTER TABLE IF EXISTS ONLY public.output_items DROP CONSTRAINT IF EXISTS "output_items_flowPlanId_fkey";
ALTER TABLE IF EXISTS ONLY public.output_items DROP CONSTRAINT IF EXISTS "output_items_batchId_fkey";
ALTER TABLE IF EXISTS ONLY public.output_destinations DROP CONSTRAINT IF EXISTS "output_destinations_flowPlanId_fkey";
ALTER TABLE IF EXISTS ONLY public.item_errors DROP CONSTRAINT IF EXISTS "item_errors_runId_fkey";
ALTER TABLE IF EXISTS ONLY public.input_sources DROP CONSTRAINT IF EXISTS "input_sources_flowPlanId_fkey";
ALTER TABLE IF EXISTS ONLY public.input_items DROP CONSTRAINT IF EXISTS "input_items_runId_fkey";
ALTER TABLE IF EXISTS ONLY public.input_items DROP CONSTRAINT IF EXISTS "input_items_flowPlanId_fkey";
ALTER TABLE IF EXISTS ONLY public.input_items DROP CONSTRAINT IF EXISTS "input_items_batchId_fkey";
ALTER TABLE IF EXISTS ONLY public.flow_plans DROP CONSTRAINT IF EXISTS "flow_plans_projectId_fkey";
ALTER TABLE IF EXISTS ONLY public.batches DROP CONSTRAINT IF EXISTS "batches_flowPlanId_fkey";
ALTER TABLE IF EXISTS ONLY public.alerts DROP CONSTRAINT IF EXISTS "alerts_userId_fkey";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public."unified_items_inputId_key";
DROP INDEX IF EXISTS public.settings_type_key;
DROP INDEX IF EXISTS public."rules_type_ownerId_name_key";
DROP INDEX IF EXISTS public."output_items_unifiedId_key";
DROP INDEX IF EXISTS public."output_items_flowPlanId_hash_idx";
DROP INDEX IF EXISTS public."output_items_flowPlanId_delivered_created_idx";
DROP INDEX IF EXISTS public."output_destinations_flowPlanId_key";
DROP INDEX IF EXISTS public."item_errors_runId_itemId_idx";
DROP INDEX IF EXISTS public."input_sources_flowPlanId_key";
DROP INDEX IF EXISTS public."input_items_flowPlanId_hash_idx";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.unified_items DROP CONSTRAINT IF EXISTS unified_items_pkey;
ALTER TABLE IF EXISTS ONLY public.settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_pkey;
ALTER TABLE IF EXISTS ONLY public.runs DROP CONSTRAINT IF EXISTS runs_pkey;
ALTER TABLE IF EXISTS ONLY public.rules DROP CONSTRAINT IF EXISTS rules_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.output_items DROP CONSTRAINT IF EXISTS output_items_pkey;
ALTER TABLE IF EXISTS ONLY public.output_destinations DROP CONSTRAINT IF EXISTS output_destinations_pkey;
ALTER TABLE IF EXISTS ONLY public.item_errors DROP CONSTRAINT IF EXISTS item_errors_pkey;
ALTER TABLE IF EXISTS ONLY public.input_sources DROP CONSTRAINT IF EXISTS input_sources_pkey;
ALTER TABLE IF EXISTS ONLY public.input_items DROP CONSTRAINT IF EXISTS input_items_pkey;
ALTER TABLE IF EXISTS ONLY public.flow_plans DROP CONSTRAINT IF EXISTS flow_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.batches DROP CONSTRAINT IF EXISTS batches_pkey;
ALTER TABLE IF EXISTS ONLY public.alerts DROP CONSTRAINT IF EXISTS alerts_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.unified_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.services ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.runs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.projects ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.output_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.output_destinations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.item_errors ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.input_sources ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.input_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.flow_plans ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.batches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.alerts ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.unified_items_id_seq;
DROP TABLE IF EXISTS public.unified_items;
DROP SEQUENCE IF EXISTS public.settings_id_seq;
DROP TABLE IF EXISTS public.settings;
DROP SEQUENCE IF EXISTS public.services_id_seq;
DROP TABLE IF EXISTS public.services;
DROP SEQUENCE IF EXISTS public.runs_id_seq;
DROP TABLE IF EXISTS public.runs;
DROP SEQUENCE IF EXISTS public.rules_id_seq;
DROP TABLE IF EXISTS public.rules;
DROP SEQUENCE IF EXISTS public.projects_id_seq;
DROP TABLE IF EXISTS public.projects;
DROP SEQUENCE IF EXISTS public.output_items_id_seq;
DROP TABLE IF EXISTS public.output_items;
DROP SEQUENCE IF EXISTS public.output_destinations_id_seq;
DROP TABLE IF EXISTS public.output_destinations;
DROP SEQUENCE IF EXISTS public.item_errors_id_seq;
DROP TABLE IF EXISTS public.item_errors;
DROP SEQUENCE IF EXISTS public.input_sources_id_seq;
DROP TABLE IF EXISTS public.input_sources;
DROP SEQUENCE IF EXISTS public.input_items_id_seq;
DROP TABLE IF EXISTS public.input_items;
DROP SEQUENCE IF EXISTS public.flow_plans_id_seq;
DROP TABLE IF EXISTS public.flow_plans;
DROP SEQUENCE IF EXISTS public.batches_id_seq;
DROP TABLE IF EXISTS public.batches;
DROP SEQUENCE IF EXISTS public.alerts_id_seq;
DROP TABLE IF EXISTS public.alerts;
DROP TYPE IF EXISTS public."SkipReason";
DROP TYPE IF EXISTS public."ServiceType";
DROP TYPE IF EXISTS public."ServiceDriver";
DROP TYPE IF EXISTS public."RunResult";
DROP TYPE IF EXISTS public."RuleType";
DROP TYPE IF EXISTS public."DriverType";
DROP TYPE IF EXISTS public."BatchState";
DROP TYPE IF EXISTS public."AlertType";
DROP TYPE IF EXISTS public."AlertMethod";
--
-- Name: AlertMethod; Type: TYPE; Schema: public; Owner: dev
--

CREATE TYPE public."AlertMethod" AS ENUM (
    'INTERACTIVE',
    'EMAIL'
);


ALTER TYPE public."AlertMethod" OWNER TO dev;

--
-- Name: AlertType; Type: TYPE; Schema: public; Owner: dev
--

CREATE TYPE public."AlertType" AS ENUM (
    'UPLOAD_REQUIRED'
);


ALTER TYPE public."AlertType" OWNER TO dev;

--
-- Name: BatchState; Type: TYPE; Schema: public; Owner: dev
--

CREATE TYPE public."BatchState" AS ENUM (
    'BATCH_CREATED',
    'DATA_FETCHED',
    'DATA_PARSED',
    'ITEMS_UNIFIED',
    'OUTPUT_CREATED',
    'OUTPUT_DELIVERED'
);


ALTER TYPE public."BatchState" OWNER TO dev;

--
-- Name: DriverType; Type: TYPE; Schema: public; Owner: dev
--

CREATE TYPE public."DriverType" AS ENUM (
    'TEST_MOCK',
    'ENABLE_BANKING',
    'NO_ACTION',
    'MANUAL_UPLOAD',
    'NORDNET',
    'TASENOR'
);


ALTER TYPE public."DriverType" OWNER TO dev;

--
-- Name: RuleType; Type: TYPE; Schema: public; Owner: dev
--

CREATE TYPE public."RuleType" AS ENUM (
    'INPUT_SOURCE',
    'FLOW'
);


ALTER TYPE public."RuleType" OWNER TO dev;

--
-- Name: RunResult; Type: TYPE; Schema: public; Owner: dev
--

CREATE TYPE public."RunResult" AS ENUM (
    'ALL_SUCCESS',
    'PARTLY_SKIPPED_SUCCESS',
    'ALL_SKIPPED',
    'PARTLY_FAIL',
    'ALL_FAILED',
    'NO_PROGRESS',
    'WAITING'
);


ALTER TYPE public."RunResult" OWNER TO dev;

--
-- Name: ServiceDriver; Type: TYPE; Schema: public; Owner: dev
--

CREATE TYPE public."ServiceDriver" AS ENUM (
    'TASENOR',
    'JSON_FILE'
);


ALTER TYPE public."ServiceDriver" OWNER TO dev;

--
-- Name: ServiceType; Type: TYPE; Schema: public; Owner: dev
--

CREATE TYPE public."ServiceType" AS ENUM (
    'CURRENCY_RATES',
    'CRYPTO_RATES'
);


ALTER TYPE public."ServiceType" OWNER TO dev;

--
-- Name: SkipReason; Type: TYPE; Schema: public; Owner: dev
--

CREATE TYPE public."SkipReason" AS ENUM (
    'DUPLICATE',
    'IN_THE_PAST'
);


ALTER TYPE public."SkipReason" OWNER TO dev;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.alerts (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    "userId" integer NOT NULL,
    type public."AlertType" NOT NULL,
    method public."AlertMethod" NOT NULL,
    url text NOT NULL,
    payload text NOT NULL,
    delivered timestamp(3) without time zone
);


ALTER TABLE public.alerts OWNER TO dev;

--
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.alerts_id_seq OWNER TO dev;

--
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- Name: batches; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.batches (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    completed timestamp(3) without time zone,
    number integer NOT NULL,
    state public."BatchState" NOT NULL,
    "lastStamp" timestamp(3) without time zone,
    "initialStock" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "endStock" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "flowPlanId" integer NOT NULL,
    data bytea,
    encoding text,
    "endBalance" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "initialBalance" jsonb DEFAULT '{}'::jsonb NOT NULL
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
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    title text NOT NULL,
    state jsonb DEFAULT '{}'::jsonb NOT NULL,
    "projectId" integer NOT NULL,
    "lastStamp" timestamp(3) without time zone,
    stock jsonb DEFAULT '{}'::jsonb NOT NULL,
    balance jsonb DEFAULT '{}'::jsonb NOT NULL,
    setup jsonb DEFAULT '{}'::jsonb NOT NULL
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
    skipped boolean NOT NULL,
    "flowPlanId" integer NOT NULL,
    "batchId" integer NOT NULL,
    "runId" integer NOT NULL,
    hash character varying(40) NOT NULL,
    "skipReason" public."SkipReason"
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
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    type public."DriverType" NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    "flowPlanId" integer NOT NULL
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
-- Name: item_errors; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.item_errors (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    "runId" integer NOT NULL,
    "itemId" integer NOT NULL,
    error text NOT NULL
);


ALTER TABLE public.item_errors OWNER TO dev;

--
-- Name: item_errors_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.item_errors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.item_errors_id_seq OWNER TO dev;

--
-- Name: item_errors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.item_errors_id_seq OWNED BY public.item_errors.id;


--
-- Name: output_destinations; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.output_destinations (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    type public."DriverType" NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    "flowPlanId" integer NOT NULL
);


ALTER TABLE public.output_destinations OWNER TO dev;

--
-- Name: output_destinations_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.output_destinations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.output_destinations_id_seq OWNER TO dev;

--
-- Name: output_destinations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.output_destinations_id_seq OWNED BY public.output_destinations.id;


--
-- Name: output_items; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.output_items (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    data jsonb NOT NULL,
    skipped boolean NOT NULL,
    delivered boolean NOT NULL,
    "unifiedId" integer NOT NULL,
    "flowPlanId" integer NOT NULL,
    "batchId" integer NOT NULL,
    "runId" integer NOT NULL,
    hash character varying(40) NOT NULL,
    "remoteId" jsonb
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
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    name text NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
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
    type public."RuleType" NOT NULL,
    "ownerId" integer NOT NULL,
    name text NOT NULL,
    key text DEFAULT ''::text NOT NULL,
    priority integer DEFAULT 50 NOT NULL,
    filter jsonb NOT NULL,
    result jsonb NOT NULL,
    "filterView" jsonb NOT NULL,
    "resultView" jsonb NOT NULL
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
    error text,
    "batchId" integer NOT NULL,
    done integer,
    result public."RunResult" DEFAULT 'NO_PROGRESS'::public."RunResult" NOT NULL,
    total integer
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
-- Name: services; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.services (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    type public."ServiceType" NOT NULL,
    name text NOT NULL,
    driver public."ServiceDriver" NOT NULL,
    free boolean NOT NULL,
    settings jsonb NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public.services OWNER TO dev;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.services_id_seq OWNER TO dev;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    type public."DriverType" NOT NULL,
    url text,
    certificate text,
    apikey text,
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
-- Name: unified_items; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.unified_items (
    id integer NOT NULL,
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    "time" timestamp(3) without time zone NOT NULL,
    data jsonb NOT NULL,
    processed boolean NOT NULL,
    skipped boolean NOT NULL,
    "inputId" integer NOT NULL,
    "flowPlanId" integer NOT NULL,
    "batchId" integer NOT NULL,
    "runId" integer NOT NULL,
    "stockChange" jsonb DEFAULT '{}'::jsonb NOT NULL
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
    created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated timestamp(3) without time zone NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    address text,
    zip text,
    city text,
    country text,
    "lastSeen" timestamp(3) without time zone,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    admin boolean DEFAULT false NOT NULL
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
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


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
-- Name: item_errors id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.item_errors ALTER COLUMN id SET DEFAULT nextval('public.item_errors_id_seq'::regclass);


--
-- Name: output_destinations id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.output_destinations ALTER COLUMN id SET DEFAULT nextval('public.output_destinations_id_seq'::regclass);


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
-- Name: services id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


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
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.alerts (id, created, updated, "userId", type, method, url, payload, delivered) FROM stdin;
1	2024-05-08 11:18:34.677	2024-05-08 11:18:34.677	1	UPLOAD_REQUIRED	INTERACTIVE	/api/v1/flow-plans/4/continue	Please select a statement to upload.	2024-05-08 11:18:34.676
\.


--
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.batches (id, created, updated, completed, number, state, "lastStamp", "initialStock", "endStock", "flowPlanId", data, encoding, "endBalance", "initialBalance") FROM stdin;
\.


--
-- Data for Name: flow_plans; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.flow_plans (id, created, updated, title, state, "projectId", "lastStamp", stock, balance, setup) FROM stdin;
1	2024-03-30 14:39:53.161	2024-04-09 08:48:44.034	Unit Testing	{}	1	\N	{}	{}	{}
3	2024-05-02 08:46:22.081	2024-05-09 07:50:14.182	Nordnet	{}	1	\N	{}	{}	{"accounts": {"CURRENCY_EUR": "3050", "CURRENCY_USD": "30505"}, "accountGrouping": {"singleFeeAccount": true, "singleTaxAccount": true, "singleLossAccount": true, "singleStockAccount": true, "singleCryptoAccount": true, "singleIncomeAccount": true, "singleProfitAccount": true, "singleExpenseAccount": true, "singleDividendAccount": true}}
5	2024-05-09 08:52:41.007	2024-05-09 08:53:41.792	Nightly Testing	{}	1	\N	{}	{}	{}
4	2024-05-08 11:08:59.91	2024-05-13 13:35:02.12	Tasenor	{}	1	\N	{}	{}	{"accounts": {"FEE": "5325", "LOSS": "5335", "STOCK": "1100", "INCOME": "9290", "PROFIT": "5050", "EXPENSE": "9690", "CURRENCY_EUR": "3050", "CURRENCY_USD": "30505", "EXTERNAL_NORDNET_EUR": "3010"}, "accountGrouping": {"singleFeeAccount": true, "singleTaxAccount": true, "singleLossAccount": true, "singleStockAccount": true, "singleCryptoAccount": true, "singleIncomeAccount": true, "singleProfitAccount": true, "singleExpenseAccount": true, "singleDividendAccount": true}}
\.


--
-- Data for Name: input_items; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.input_items (id, created, updated, data, processed, skipped, "flowPlanId", "batchId", "runId", hash, "skipReason") FROM stdin;
\.


--
-- Data for Name: input_sources; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.input_sources (id, created, updated, type, settings, "flowPlanId") FROM stdin;
1	2024-03-30 14:41:15.195	2024-04-02 17:06:29.167	TEST_MOCK	{"url": "file:///test.csv"}	1
3	2024-05-02 08:46:22.094	2024-05-02 08:46:22.094	NORDNET	{}	3
4	2024-05-08 11:08:59.924	2024-05-08 11:08:59.924	NORDNET	{}	4
5	2024-05-09 08:54:24.336	2024-05-09 08:54:04.898	NORDNET	{}	5
\.


--
-- Data for Name: item_errors; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.item_errors (id, created, updated, "runId", "itemId", error) FROM stdin;
\.


--
-- Data for Name: output_destinations; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.output_destinations (id, created, updated, type, settings, "flowPlanId") FROM stdin;
1	2024-04-15 11:40:33.161	2024-04-25 12:45:18.235	NO_ACTION	{}	1
3	2024-05-02 08:46:22.097	2024-05-02 08:46:22.097	NO_ACTION	{}	3
4	2024-05-08 11:08:59.929	2024-05-08 11:17:59.283	TASENOR	{"host": "http://localhost:7205", "user": "user@localhost", "database": "tadex", "password": "Ayfiewchg872rt5sq2e4"}	4
5	2024-05-09 08:54:45.438	2024-05-09 08:54:26.574	NO_ACTION	{}	5
\.


--
-- Data for Name: output_items; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.output_items (id, created, updated, data, skipped, delivered, "unifiedId", "flowPlanId", "batchId", "runId", hash, "remoteId") FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.projects (id, created, updated, name, settings, "userId") FROM stdin;
1	2024-03-30 14:39:17.243	2024-04-09 17:51:20.083	Testing	{"currency": "EUR", "language": "fi"}	1
\.


--
-- Data for Name: rules; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.rules (id, created, updated, type, "ownerId", name, key, priority, filter, result, "filterView", "resultView") FROM stdin;
9	2024-05-08 11:18:41.962	2024-05-08 11:18:41.962	INPUT_SOURCE	4	Deposit	TALLETUS	50	"Tapahtumatyyppi == 'TALLETUS'"	{"type": "'deposit'", "value": "Summa", "service": "'Nordnet'", "valueAsset": "Valuutta"}	{}	{}
10	2024-05-08 11:18:41.966	2024-05-08 11:18:41.966	INPUT_SOURCE	4	Withdrawal	NOSTO	50	"Tapahtumatyyppi == 'NOSTO'"	{"type": "'withdrawal'", "value": "-Summa", "service": "'Nordnet'", "valueAsset": "Valuutta"}	{}	{}
11	2024-05-08 11:18:41.97	2024-05-08 11:18:41.97	INPUT_SOURCE	4	Monthly Saving Fee	ETF_KK SÄÄSTÖN PALVELUMAKSU	50	"Tapahtumatyyppi == 'ETF_KK SÄÄSTÖN PALVELUMAKSU'"	{"text": "Tapahtumateksti", "type": "'expense'", "value": "-Summa", "account": "'FEE_MONTHLY_SAVING'", "valueAsset": "Valuutta"}	{}	{}
12	2024-05-08 11:18:41.973	2024-05-08 11:18:41.973	INPUT_SOURCE	4	Stock Buy	OSTO	50	"Tapahtumatyyppi == 'OSTO'"	{"fee": "Kokonaiskulut", "type": "'buy'", "rates": "rates(Valuutta, Vaihtokurssi)", "value": "-Summa", "assetIn": "Arvopaperi", "feeAsset": "$('Kokonaiskulut Valuutta')", "valueAsset": "Valuutta", "assetTypeIn": "'STOCK'", "assetAmountIn": "Määrä"}	{}	{}
13	2024-05-08 11:18:41.977	2024-05-08 11:18:41.977	INPUT_SOURCE	4	Stock Sell	MYYNTI	50	"Tapahtumatyyppi == 'MYYNTI'"	{"fee": "Kokonaiskulut", "type": "'sell'", "rates": "rates(Valuutta, Vaihtokurssi)", "value": "Summa + Kokonaiskulut", "assetOut": "Arvopaperi", "feeAsset": "$('Kokonaiskulut Valuutta')", "valueAsset": "Valuutta", "assetTypeOut": "'STOCK'", "assetAmountOut": "Määrä"}	{}	{}
14	2024-05-08 11:18:41.98	2024-05-08 11:18:41.98	INPUT_SOURCE	4	Dividend	OSINKO	50	"Tapahtumatyyppi == 'OSINKO'"	{"text": "Tapahtumateksti", "type": "'income'", "rates": "rates(Valuutta, Vaihtokurssi)", "value": "Summa", "reason": "'DIVIDEND'", "multipart": "Vahvistusnumero", "valueAsset": "Valuutta", "reasonAsset": "Arvopaperi"}	{}	{}
15	2024-05-08 11:18:41.983	2024-05-08 11:18:41.983	INPUT_SOURCE	4	Interest Expenses		50	"Tapahtumatyyppi == 'LAINAKORKO' or Tapahtumatyyppi == 'PÄÄOMIT YLIT.KORKO'"	{"type": "'expense'", "rates": "rates(Valuutta, Vaihtokurssi)", "value": "-Summa", "reason": "'INTEREST'", "account": "'EXPENSE_INTEREST'", "valueAsset": "Valuutta"}	{}	{}
16	2024-05-08 11:18:41.988	2024-05-08 11:18:41.988	INPUT_SOURCE	4	Forex Sell (Foreign to Local)	VALUUTAN MYYNTI	50	"Tapahtumatyyppi == 'VALUUTAN MYYNTI' and Summa < 0 and currency != Valuutta"	{"type": "'forex'", "rates": "rates(Valuutta, Vaihtokurssi)", "assetOut": "Valuutta", "multipart": "Vahvistusnumero", "assetAmountOut": "-Summa"}	{}	{}
17	2024-05-08 11:18:41.992	2024-05-08 11:18:41.992	INPUT_SOURCE	4	Forex Buy (Foreign to Local)	VALUUTAN OSTO	50	"Tapahtumatyyppi == 'VALUUTAN OSTO' and Summa > 0 and currency == Valuutta"	{"type": "'forex'", "value": "Summa", "multipart": "Vahvistusnumero", "valueAsset": "Valuutta"}	{}	{}
18	2024-05-08 11:18:41.995	2024-05-08 11:18:41.995	INPUT_SOURCE	4	Forex Sell (Local to foreign)	VALUUTAN MYYNTI	50	"Tapahtumatyyppi == 'VALUUTAN MYYNTI' and Summa < 0 and currency == Valuutta"	{"type": "'forex'", "value": "-Summa", "multipart": "Vahvistusnumero", "valueAsset": "Valuutta"}	{}	{}
19	2024-05-08 11:18:41.998	2024-05-08 11:18:41.998	INPUT_SOURCE	4	Forex Buy (Local to foreign)	VALUUTAN OSTO	50	"Tapahtumatyyppi == 'VALUUTAN OSTO' and Summa > 0 and currency != Valuutta"	{"type": "'forex'", "rates": "rates($('Kokonaiskulut Valuutta'), Vaihtokurssi)", "assetIn": "Valuutta", "multipart": "Vahvistusnumero", "assetAmountIn": "Summa"}	{}	{}
20	2024-05-08 11:18:42.002	2024-05-08 11:18:42.002	INPUT_SOURCE	4	Instrument renaming (Old name)	VAIHTO AP-OTTO	50	"Tapahtumatyyppi == 'VAIHTO AP-OTTO'"	{"text": "Tapahtumateksti", "type": "'rename'", "assetOut": "Arvopaperi", "multipart": "Vahvistusnumero"}	{}	{}
21	2024-05-08 11:18:42.005	2024-05-08 11:18:42.005	INPUT_SOURCE	4	Instrument renaming (New name)	VAIHTO AP-JÄTTÖ	50	"Tapahtumatyyppi == 'VAIHTO AP-JÄTTÖ'"	{"type": "'rename'", "value": "Summa", "assetIn": "Arvopaperi", "multipart": "Vahvistusnumero", "valueAsset": "Valuutta", "assetTypeIn": "'STOCK'", "assetAmountIn": "Määrä"}	{}	{}
22	2024-05-08 11:18:42.008	2024-05-08 11:18:42.008	INPUT_SOURCE	4	Instrument split (Original instrument)	SPLIT AP OTTO	50	"Tapahtumatyyppi == 'SPLIT AP OTTO'"	{"text": "Tapahtumateksti", "type": "'split'", "multipart": "Vahvistusnumero", "assetAmountOut": "Määrä"}	{}	{}
23	2024-05-08 11:18:42.011	2024-05-08 11:18:42.011	INPUT_SOURCE	4	Instrument split (New instrument)	SPLIT AP JÄTTÖ	50	"Tapahtumatyyppi == 'SPLIT AP JÄTTÖ'"	{"type": "'split'", "value": "Summa", "assetIn": "Arvopaperi", "multipart": "Vahvistusnumero", "valueAsset": "Valuutta", "assetTypeIn": "'STOCK'", "assetAmountIn": "Määrä"}	{}	{}
24	2024-05-08 11:18:42.014	2024-05-08 11:18:42.014	INPUT_SOURCE	4	Withholding Tax	ENNAKKOPIDÄTYS	50	"Tapahtumatyyppi == 'ENNAKKOPIDÄTYS'"	{"taxType": "'withholding'", "taxAsset": "Valuutta", "multipart": "Vahvistusnumero", "taxAmount": "-Summa"}	{}	{}
25	2024-05-08 11:18:42.017	2024-05-08 11:18:42.017	INPUT_SOURCE	4	Interest Refund	DEBET KORON KORJ.	50	"Tapahtumatyyppi == 'DEBET KORON KORJ.'"	{"type": "'income'", "value": "Summa", "reason": "'INTEREST_REFUND'", "account": "'EXPENSE_INTEREST'", "valueAsset": "Valuutta"}	{}	{}
\.


--
-- Data for Name: runs; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.runs (id, created, updated, "initialState", "finalState", error, "batchId", done, result, total) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.services (id, created, updated, type, name, driver, free, settings, "userId") FROM stdin;
1	2024-04-18 15:46:48.721	2024-04-18 15:46:10.27	CRYPTO_RATES	Test Files	JSON_FILE	f	{"url": "file:///rates.json"}	1
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.settings (id, type, url, certificate, apikey, "user", password, options) FROM stdin;
2	TEST_MOCK	\N	\N	\N	\N	\N	{}
1	NO_ACTION	\N	\N	\N	\N	\N	{}
3	MANUAL_UPLOAD	\N	\N	\N	\N	\N	{}
4	NORDNET	\N	\N	\N	\N	\N	{}
5	TASENOR	\N	\N	\N	\N	\N	{}
\.


--
-- Data for Name: unified_items; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.unified_items (id, created, updated, "time", data, processed, skipped, "inputId", "flowPlanId", "batchId", "runId", "stockChange") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.users (id, created, updated, email, password, name, address, zip, city, country, "lastSeen", settings, admin) FROM stdin;
1	2024-03-30 14:38:56.726	2024-04-05 07:08:25.754	test@localhost	$2b$13$YAnqCS/Zsov6Bt5fR3phDelItsA6PpCLYl/kotccl5hAgbVojUQqC	Tommi Ronkainen	Ahvenisjärventie 22	33720	Tampere	Finland	\N	{"projectId": 1}	f
\.


--
-- Name: alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.alerts_id_seq', 1, true);


--
-- Name: batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.batches_id_seq', 6, true);


--
-- Name: flow_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.flow_plans_id_seq', 5, true);


--
-- Name: input_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.input_items_id_seq', 12, true);


--
-- Name: input_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.input_sources_id_seq', 5, true);


--
-- Name: item_errors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.item_errors_id_seq', 1, false);


--
-- Name: output_destinations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.output_destinations_id_seq', 5, true);


--
-- Name: output_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.output_items_id_seq', 10, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.projects_id_seq', 2, false);


--
-- Name: rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.rules_id_seq', 25, true);


--
-- Name: runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.runs_id_seq', 52, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.services_id_seq', 1, false);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.settings_id_seq', 5, true);


--
-- Name: unified_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.unified_items_id_seq', 8, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.users_id_seq', 2, false);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


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
-- Name: item_errors item_errors_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.item_errors
    ADD CONSTRAINT item_errors_pkey PRIMARY KEY (id);


--
-- Name: output_destinations output_destinations_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.output_destinations
    ADD CONSTRAINT output_destinations_pkey PRIMARY KEY (id);


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
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


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
-- Name: input_items_flowPlanId_hash_idx; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX "input_items_flowPlanId_hash_idx" ON public.input_items USING btree ("flowPlanId", hash);


--
-- Name: input_sources_flowPlanId_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "input_sources_flowPlanId_key" ON public.input_sources USING btree ("flowPlanId");


--
-- Name: item_errors_runId_itemId_idx; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX "item_errors_runId_itemId_idx" ON public.item_errors USING btree ("runId", "itemId");


--
-- Name: output_destinations_flowPlanId_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "output_destinations_flowPlanId_key" ON public.output_destinations USING btree ("flowPlanId");


--
-- Name: output_items_flowPlanId_delivered_created_idx; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX "output_items_flowPlanId_delivered_created_idx" ON public.output_items USING btree ("flowPlanId", delivered, created);


--
-- Name: output_items_flowPlanId_hash_idx; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX "output_items_flowPlanId_hash_idx" ON public.output_items USING btree ("flowPlanId", hash);


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
-- Name: alerts alerts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: item_errors item_errors_runId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.item_errors
    ADD CONSTRAINT "item_errors_runId_fkey" FOREIGN KEY ("runId") REFERENCES public.runs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: output_destinations output_destinations_flowPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.output_destinations
    ADD CONSTRAINT "output_destinations_flowPlanId_fkey" FOREIGN KEY ("flowPlanId") REFERENCES public.flow_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: services services_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "services_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


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

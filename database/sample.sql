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
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    password text NOT NULL
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
56	2024-04-04 07:41:52.732	2024-04-04 07:41:52.822	1	DATA_FETCHED	2	\N	{"transactions":[{"entry_reference":"e0f519a7-b10a-45f7-90b4-4925002ee8f9","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"21.45"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"SMM Appartments","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-04-04","value_date":"2024-04-03","transaction_date":"2024-04-04","balance_after_transaction":null,"reference_number":"221127019888","remittance_information":["221127019888","Rent"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"6c41b21b-773d-407e-8a2c-dd329707d3e9","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"9.52"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"Simon Baker","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-04-03","value_date":"2024-04-03","transaction_date":"2024-04-03","balance_after_transaction":null,"reference_number":"111144419244","remittance_information":["111144419244","Kiitos"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"673afc2e-f39a-4607-acd6-62b8a3dbbbc6","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"0.08"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"Salo Ari","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-04-03","value_date":"2024-04-03","transaction_date":"2024-04-03","balance_after_transaction":null,"reference_number":"301127019500","remittance_information":["301127019500","Lotto"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"40fd1462-d451-46be-a566-7da397163f98","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"3.44"},"creditor":{"name":"Wallmart","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":{"iban":null,"other":{"identification":"1234.0","scheme_name":"CPAN","issuer":null}},"debtor_agent":null,"bank_transaction_code":{"description":"Korttiosto","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-04-03","value_date":"2024-04-03","transaction_date":"2024-04-03","balance_after_transaction":null,"reference_number":"678944335600","remittance_information":["678944335600","USD 9.39 Gotham City"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"77598828-0b9f-46dd-960b-7075ef9ebe04","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"8.22"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"Simon Baker","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-04-03","value_date":"2024-04-03","transaction_date":"2024-04-03","balance_after_transaction":null,"reference_number":"111144419244","remittance_information":["111144419244","Kiitos"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"5eef0868-c292-4e23-87b9-760f3a7e35d0","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"6.21"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"Simon Baker","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-04-03","value_date":"2024-04-03","transaction_date":"2024-04-03","balance_after_transaction":null,"reference_number":"111144419244","remittance_information":["111144419244","Kiitos"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"9f2219a7-5852-4fc8-af36-6e3f9d2ed19e","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"0.08"},"creditor":{"name":"Salo Johanna","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Itsepalvelu","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-04-02","value_date":"2024-04-02","transaction_date":"2024-04-02","balance_after_transaction":null,"reference_number":"671232100994","remittance_information":["671232100994","Kino","Kino "],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"b63bdd6b-93c8-4495-89aa-9bae18c8a5a4","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"0.11"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"Salo Ari","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-04-02","value_date":"2024-04-02","transaction_date":"2024-04-02","balance_after_transaction":null,"reference_number":"301127019500","remittance_information":["301127019500","Lotto"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"05bfeb6c-3dc1-4ec4-aa6d-a389c2f797e0","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"4.20"},"creditor":{"name":"ATM 2312","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":{"iban":null,"other":{"identification":"1234","scheme_name":"CPAN","issuer":null}},"debtor_agent":null,"bank_transaction_code":{"description":"Debet automaattiotto","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-04-02","value_date":"2024-04-02","transaction_date":"2024-04-02","balance_after_transaction":null,"reference_number":"101015553332","remittance_information":["101015553332","EUR 20.00 Vasa"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"6e47667a-b8e4-4afa-9b36-7baade8781c4","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"0.04"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"Salo Ari","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-04-02","value_date":"2024-04-02","transaction_date":"2024-04-02","balance_after_transaction":null,"reference_number":"301127019500","remittance_information":["301127019500","Lotto"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"c49c03dc-2075-4ecc-8975-a75661f7dd2b","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"14.00"},"creditor":{"name":"Cross  Sports Club","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"e-maksu","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-04-02","value_date":"2024-04-02","transaction_date":"2024-04-02","balance_after_transaction":null,"reference_number":"660562087011","remittance_information":["660562087011","01012019"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"d59cadd3-8ca1-42cb-94a0-6ef48f27cd54","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"2.40"},"creditor":{"name":"Helsinkimissio ry","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Itsepalvelu","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-04-02","value_date":"2024-04-02","transaction_date":"2024-04-02","balance_after_transaction":null,"reference_number":"181120258878060000","remittance_information":["181120258878060000","18110005577211"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"7dfd5556-9bab-49d2-b606-d86858f33b55","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"96.00"},"creditor":{"name":"Salo Johanna","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Itsepalvelu","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-04-02","value_date":"2024-04-02","transaction_date":"2024-04-02","balance_after_transaction":null,"reference_number":"447711118878060000","remittance_information":["447711118878060000","Mobile phone"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"16be4445-fbc9-423a-a6af-f6a83b73c916","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"0.13"},"creditor":{"name":"Salo Johanna","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Itsepalvelu","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-04-02","value_date":"2024-04-02","transaction_date":"2024-04-02","balance_after_transaction":null,"reference_number":"671232100994","remittance_information":["671232100994","Kino","Kino "],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"694c1ae3-b250-4c4f-9dd3-e397e00806a4","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"9.90"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"SMM Appartments","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-04-01","value_date":"2024-04-01","transaction_date":"2024-04-01","balance_after_transaction":null,"reference_number":"221127019888","remittance_information":["221127019888","Rent"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"534973c1-a8df-43fe-bcf4-d3e9ab0a9b27","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"22.50"},"creditor":{"name":"Cross  Sports Club","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"e-maksu","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-04-01","value_date":"2024-04-01","transaction_date":"2024-04-01","balance_after_transaction":null,"reference_number":"660562087011","remittance_information":["660562087011","01012019"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"8788b1ad-6e4d-4bea-bc24-6b8660b7700f","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"24.18"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"KELA/FPA","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-04-01","value_date":"2024-04-01","transaction_date":"2024-04-01","balance_after_transaction":null,"reference_number":"LL4200K6790","remittance_information":["LL4200K6790","Lapsilisä"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"905a6fcb-fa09-4e8a-aac7-77b9cc94739c","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"6.41"},"creditor":{"name":"Avis","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":{"iban":null,"other":{"identification":"1234.0","scheme_name":"CPAN","issuer":null}},"debtor_agent":null,"bank_transaction_code":{"description":"Korttiosto","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-04-01","value_date":"2024-04-01","transaction_date":"2024-04-01","balance_after_transaction":null,"reference_number":"795622333023","remittance_information":["795622333023","GBP 31.20 Heathrow"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"1706ea25-f97f-43d7-8466-ad4912ae4c16","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"21.70"},"creditor":{"name":"ATM Nosto 1212","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":{"iban":null,"other":{"identification":"1234","scheme_name":"CPAN","issuer":null}},"debtor_agent":null,"bank_transaction_code":{"description":"Debet automaattiotto","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-04-01","value_date":"2024-04-01","transaction_date":"2024-04-01","balance_after_transaction":null,"reference_number":"550772345","remittance_information":["550772345","EUR 35.00 Helsinki"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"3559b4b6-9b30-43d6-a397-81ff3a70107b","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"9.72"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"Simon Baker","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-03-31","value_date":"2024-03-31","transaction_date":"2024-03-31","balance_after_transaction":null,"reference_number":"111144419244","remittance_information":["111144419244","Kiitos"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"8c4f5b4e-9062-44a7-8a32-9c3a843c05f9","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"2.65"},"creditor":{"name":"Salo Ari","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Mibiilimaksu","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-31","value_date":"2024-03-31","transaction_date":"2024-03-31","balance_after_transaction":null,"reference_number":"221127000000","remittance_information":["221127000000","For present to Johanna"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"d7ca9a04-fac7-4d82-b972-5d0102cd5cf9","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"0.02"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"Salo Ari","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-03-31","value_date":"2024-03-31","transaction_date":"2024-03-31","balance_after_transaction":null,"reference_number":"301127019500","remittance_information":["301127019500","Lotto"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"4279a122-aa32-455e-a6e7-550d3cd47821","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"3.44"},"creditor":{"name":"Wallmart","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":{"iban":null,"other":{"identification":"1234.0","scheme_name":"CPAN","issuer":null}},"debtor_agent":null,"bank_transaction_code":{"description":"Korttiosto","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-31","value_date":"2024-03-31","transaction_date":"2024-03-31","balance_after_transaction":null,"reference_number":"678944335600","remittance_information":["678944335600","USD 9.39 Gotham City"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"c8a71691-22c7-4077-9ea8-f995961b95ad","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"8.25"},"creditor":{"name":"Helsinkimissio ry","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Itsepalvelu","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-30","value_date":"2024-03-30","transaction_date":"2024-03-30","balance_after_transaction":null,"reference_number":"181120258878060000","remittance_information":["181120258878060000","18110005577211"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"dabcc5cb-c5b1-42d7-92a4-eb5ef34235f5","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"16.50"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"SMM Appartments","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-03-30","value_date":"2024-03-30","transaction_date":"2024-03-30","balance_after_transaction":null,"reference_number":"221127019888","remittance_information":["221127019888","Rent"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"4496da42-21a2-4838-8e74-a188c6956356","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"0.02"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"Salo Ari","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-03-30","value_date":"2024-03-30","transaction_date":"2024-03-30","balance_after_transaction":null,"reference_number":"301127019500","remittance_information":["301127019500","Lotto"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"357cd310-8b3b-4ff2-9c3b-e81e106bb099","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"85.50"},"creditor":{"name":"Salo Johanna","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Itsepalvelu","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-30","value_date":"2024-03-30","transaction_date":"2024-03-30","balance_after_transaction":null,"reference_number":"447711118878060000","remittance_information":["447711118878060000","Mobile phone"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"74c23aae-2d80-4e6b-ac2b-ad952d21c8c9","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"9.30"},"creditor":{"name":"Helsinkimissio ry","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Itsepalvelu","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-30","value_date":"2024-03-30","transaction_date":"2024-03-30","balance_after_transaction":null,"reference_number":"181120258878060000","remittance_information":["181120258878060000","18110005577211"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"9e228f9a-7bdd-4823-a3c4-6fe9cd44b807","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"1.52"},"creditor":{"name":"Wallmart","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":{"iban":null,"other":{"identification":"1234.0","scheme_name":"CPAN","issuer":null}},"debtor_agent":null,"bank_transaction_code":{"description":"Korttiosto","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-29","value_date":"2024-03-29","transaction_date":"2024-03-29","balance_after_transaction":null,"reference_number":"678944335600","remittance_information":["678944335600","USD 9.39 Gotham City"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"3375f213-e70d-407f-98b9-249b66e4a5d4","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"21.00"},"creditor":{"name":"ATM Nosto 1212","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":{"iban":null,"other":{"identification":"1234","scheme_name":"CPAN","issuer":null}},"debtor_agent":null,"bank_transaction_code":{"description":"Debet automaattiotto","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-29","value_date":"2024-03-29","transaction_date":"2024-03-29","balance_after_transaction":null,"reference_number":"550772345","remittance_information":["550772345","EUR 35.00 Helsinki"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"61a739c7-b8b9-437d-ae6a-2588bae8a5fa","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"0.04"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"Salo Ari","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-03-29","value_date":"2024-03-29","transaction_date":"2024-03-29","balance_after_transaction":null,"reference_number":"301127019500","remittance_information":["301127019500","Lotto"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"fab1b42a-691d-4ae9-9324-533f3acf1f16","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"0.48"},"creditor":{"name":"K market Helsinki","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":{"iban":null,"other":{"identification":"1234","scheme_name":"CPAN","issuer":null}},"debtor_agent":null,"bank_transaction_code":{"description":"Korttiosto","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-29","value_date":"2024-03-29","transaction_date":"2024-03-29","balance_after_transaction":null,"reference_number":"18110005577890","remittance_information":["18110005577890","Helsinki"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"ff68b887-54c7-4984-bb3b-aa3448f08d18","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"7.70"},"creditor":{"name":"ATM Nosto 1212","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":{"iban":null,"other":{"identification":"1234","scheme_name":"CPAN","issuer":null}},"debtor_agent":null,"bank_transaction_code":{"description":"Debet automaattiotto","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-29","value_date":"2024-03-29","transaction_date":"2024-03-29","balance_after_transaction":null,"reference_number":"550772345","remittance_information":["550772345","EUR 35.00 Helsinki"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"f43c0844-1a27-4878-be24-66cd4232c85d","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"9.36"},"creditor":{"name":"K market Helsinki","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":{"iban":null,"other":{"identification":"1234","scheme_name":"CPAN","issuer":null}},"debtor_agent":null,"bank_transaction_code":{"description":"Korttiosto","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-29","value_date":"2024-03-29","transaction_date":"2024-03-29","balance_after_transaction":null,"reference_number":"18110005577890","remittance_information":["18110005577890","Helsinki"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"efa83424-389c-4ba3-b4fa-9cf5fe9acb2e","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"28.00"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"Salo Ari","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Oma siirto","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-03-29","value_date":"2024-03-29","transaction_date":"2024-03-29","balance_after_transaction":null,"reference_number":null,"remittance_information":["Lahjat"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"41eb4119-a4bc-4246-9dd1-eeeb54568a63","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"2.20"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"Simon Baker","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-03-28","value_date":"2024-03-28","transaction_date":"2024-03-28","balance_after_transaction":null,"reference_number":"111144419244","remittance_information":["111144419244","Kiitos"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"836a4709-13dc-401c-a4c5-0bfe7296d55c","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"9.60"},"creditor":{"name":"Helsinkimissio ry","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Itsepalvelu","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-28","value_date":"2024-03-28","transaction_date":"2024-03-28","balance_after_transaction":null,"reference_number":"181120258878060000","remittance_information":["181120258878060000","18110005577211"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"705074e9-d803-4a78-938f-9fa379dad28c","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"5.85"},"creditor":{"name":"Gebr Heinemann Retail","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":{"iban":null,"other":{"identification":"1234","scheme_name":"CPAN","issuer":null}},"debtor_agent":null,"bank_transaction_code":{"description":"Korttiosto","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-28","value_date":"2024-03-28","transaction_date":"2024-03-28","balance_after_transaction":null,"reference_number":"181114280444","remittance_information":["181114280444","DKK 49,00 Kastrup"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"7dd36cfa-d5f0-4fe3-bdb9-89ee0a8b7be8","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"11.00"},"creditor":null,"creditor_account":null,"creditor_agent":null,"debtor":{"name":"SMM Appartments","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"debtor_account":null,"debtor_agent":null,"bank_transaction_code":{"description":"Pano","code":null,"sub_code":null},"credit_debit_indicator":"CRDT","status":"BOOK","booking_date":"2024-03-28","value_date":"2024-03-28","transaction_date":"2024-03-28","balance_after_transaction":null,"reference_number":"221127019888","remittance_information":["221127019888","Rent"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null},{"entry_reference":"81059fc8-fb29-4cf3-8c4e-a70e7f7375a1","merchant_category_code":null,"transaction_amount":{"currency":"EUR","amount":"6.72"},"creditor":{"name":"Gebr Heinemann Retail","postal_address":null,"organisation_id":null,"private_id":null,"contact_details":null},"creditor_account":null,"creditor_agent":null,"debtor":null,"debtor_account":{"iban":null,"other":{"identification":"1234","scheme_name":"CPAN","issuer":null}},"debtor_agent":null,"bank_transaction_code":{"description":"Korttiosto","code":null,"sub_code":null},"credit_debit_indicator":"DBIT","status":"BOOK","booking_date":"2024-03-27","value_date":"2024-03-27","transaction_date":"2024-03-27","balance_after_transaction":null,"reference_number":"181114280444","remittance_information":["181114280444","DKK 49,00 Kastrup"],"debtor_account_additional_identification":null,"creditor_account_additional_identification":null,"exchange_rate":null,"note":null,"transaction_id":null}],"continuation_key":"eyJhY2NvdW50SWQiOiJDQUNDI0ZJbmlyeFBEYWgwQWRkYWtQM3R4aWxtNHNLdlotTmtxUnQ1SGh3RWw1UTNyOCIsImRhdGVGcm9tIjpudWxsLCJkYXRlVG8iOm51bGwsInRyYW5zYWN0aW9uU3RhdHVzIjpudWxsLCJwYWdlUmVmZXJlbmNlIjoic2FuZGJveENvbnRpbnVhdGlvbktleS0yIiwiZmV0Y2hTdGFydFRpbWVzdGFtcCI6bnVsbCwibGFzdFJlcXVlc3RUaW1lc3RhbXAiOm51bGx9.79ccc56980384e7bfab63258ada5b325f29c99727b36895fca56d5dc23a725ff"}
\.


--
-- Data for Name: flow_plans; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.flow_plans (id, title, created, updated, "projectId", "lastStamp", state) FROM stdin;
1	Test Files	2024-03-30 14:39:53.161	2024-04-03 16:35:50.15	1	\N	{}
2	Enable Banking	2024-04-03 09:43:15.969	2024-04-04 07:41:52.793	1	\N	{"accountId": "effd5fa1-bea1-42fa-b887-de1d0eb4fd51", "sessionId": "3768ec99-5baf-4f3f-bbef-df7e95ce6b23", "validUntil": "2024-04-14T07:31:37.165000Z"}
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
269	2024-04-04 07:41:52.746	2024-04-04 07:41:52.826	BATCH_CREATED	DATA_FETCHED	56	\N
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.settings (id, type, url, certificate, "user", password, options, apikey) FROM stdin;
1	ENABLE_BANKING	https://api.enablebanking.com/	-----BEGIN PRIVATE KEY-----\n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\ntOrma5H37YRxwdnXa84c0rcvFc6UXA==\n-----END PRIVATE KEY-----	\N	\N	{}	cfb2671e-6788-4d9b-878f-cb4fd7ab1077
2	TEST_MOCK_INPUT	\N	\N	\N	\N	{}	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.users (id, email, name, address, zip, city, country, last_seen, created, updated, settings, password) FROM stdin;
1	tommi.ronkainen@gmail.com	Tommi Ronkainen	Ahvenisjärventie 22	33720	Tampere	Finland	\N	2024-03-30 14:38:56.726	2024-03-30 14:38:12.548	{}	Hbdd26oqCJuVvIhoAiRNmeX71ysqh1mr0ZOMo3tyIwKagyoyfo.JK
\.


--
-- Name: batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public.batches_id_seq', 56, true);


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

SELECT pg_catalog.setval('public.runs_id_seq', 269, true);


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


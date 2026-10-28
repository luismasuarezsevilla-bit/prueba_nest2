--
-- PostgreSQL database dump
--

\restrict E4GJerwYtT36wWDPQLVmJFQg4V5n4aXahmfLzBFFaQA8L0n3nxRAgDGumJHMQqY

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

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

--
-- Name: maintenance_status_logs_fromstatus_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenance_status_logs_fromstatus_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: maintenance_status_logs_tostatus_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenance_status_logs_tostatus_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: maintenances_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenances_status_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: maintenances_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenances_type_enum AS ENUM (
    'PREVENTIVE',
    'CORRECTIVE'
);


--
-- Name: mechanics_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mechanics_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_role_enum AS ENUM (
    'ADMIN',
    'TECHNICIAN'
);


--
-- Name: vehicles_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vehicles_status_enum AS ENUM (
    'AVAILABLE',
    'IN_MAINTENANCE',
    'INACTIVE'
);


--
-- Name: workshops_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workshops_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: maintenance_status_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_status_logs (
    id integer NOT NULL,
    "fromStatus" public.maintenance_status_logs_fromstatus_enum,
    "toStatus" public.maintenance_status_logs_tostatus_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "maintenanceId" integer NOT NULL,
    "changedById" integer
);


--
-- Name: maintenance_status_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenance_status_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenance_status_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenance_status_logs_id_seq OWNED BY public.maintenance_status_logs.id;


--
-- Name: maintenances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenances (
    id integer NOT NULL,
    type public.maintenances_type_enum NOT NULL,
    description text NOT NULL,
    mileage integer NOT NULL,
    "scheduledStart" timestamp with time zone NOT NULL,
    "scheduledEnd" timestamp with time zone NOT NULL,
    status public.maintenances_status_enum DEFAULT 'SCHEDULED'::public.maintenances_status_enum NOT NULL,
    "workDone" text,
    "finalCost" numeric(12,2),
    "finishedAt" timestamp with time zone,
    "finalMileage" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "vehicleId" integer NOT NULL,
    "mechanicId" integer NOT NULL,
    "workshopId" integer NOT NULL
);


--
-- Name: maintenances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenances_id_seq OWNED BY public.maintenances.id;


--
-- Name: mechanics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mechanics (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    specialty character varying NOT NULL,
    status public.mechanics_status_enum DEFAULT 'ACTIVE'::public.mechanics_status_enum NOT NULL,
    user_id integer
);


--
-- Name: mechanics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mechanics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mechanics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mechanics_id_seq OWNED BY public.mechanics.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    "fullName" character varying NOT NULL,
    role public.users_role_enum DEFAULT 'TECHNICIAN'::public.users_role_enum NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id integer NOT NULL,
    plate character varying NOT NULL,
    brand character varying NOT NULL,
    model character varying NOT NULL,
    year integer NOT NULL,
    mileage integer NOT NULL,
    status public.vehicles_status_enum DEFAULT 'AVAILABLE'::public.vehicles_status_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehicles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicles_id_seq OWNED BY public.vehicles.id;


--
-- Name: workshops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workshops (
    id integer NOT NULL,
    name character varying NOT NULL,
    address character varying NOT NULL,
    status public.workshops_status_enum DEFAULT 'ACTIVE'::public.workshops_status_enum NOT NULL
);


--
-- Name: workshops_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workshops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workshops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workshops_id_seq OWNED BY public.workshops.id;


--
-- Name: maintenance_status_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_status_logs ALTER COLUMN id SET DEFAULT nextval('public.maintenance_status_logs_id_seq'::regclass);


--
-- Name: maintenances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances ALTER COLUMN id SET DEFAULT nextval('public.maintenances_id_seq'::regclass);


--
-- Name: mechanics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics ALTER COLUMN id SET DEFAULT nextval('public.mechanics_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vehicles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN id SET DEFAULT nextval('public.vehicles_id_seq'::regclass);


--
-- Name: workshops id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops ALTER COLUMN id SET DEFAULT nextval('public.workshops_id_seq'::regclass);


--
-- Data for Name: maintenance_status_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.maintenance_status_logs VALUES (1, NULL, 'SCHEDULED', '2026-10-27 23:38:21.209873', 1, 1);
INSERT INTO public.maintenance_status_logs VALUES (2, 'SCHEDULED', 'IN_PROGRESS', '2026-10-27 23:38:21.211752', 1, 1);
INSERT INTO public.maintenance_status_logs VALUES (3, 'IN_PROGRESS', 'COMPLETED', '2026-10-27 23:38:21.213374', 1, 1);
INSERT INTO public.maintenance_status_logs VALUES (4, NULL, 'SCHEDULED', '2026-10-27 23:38:21.217572', 2, 1);
INSERT INTO public.maintenance_status_logs VALUES (5, 'SCHEDULED', 'IN_PROGRESS', '2026-10-27 23:38:21.218888', 2, 1);


--
-- Data for Name: maintenances; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.maintenances VALUES (1, 'PREVENTIVE', 'Cambio de aceite y filtros', 44800, '2026-09-15 13:00:00+00', '2026-09-15 16:30:00+00', 'COMPLETED', 'Cambio de aceite y filtros', 350000.00, '2026-09-15 16:30:00+00', 45000, '2026-10-27 23:38:21.207131', 1, 1, 1);
INSERT INTO public.maintenances VALUES (2, 'CORRECTIVE', 'Reemplazo de pastillas de freno', 78000, '2026-10-27 13:00:00+00', '2026-10-27 18:00:00+00', 'IN_PROGRESS', NULL, NULL, NULL, NULL, '2026-10-27 23:38:21.215815', 3, 2, 1);


--
-- Data for Name: mechanics; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.mechanics VALUES (1, 'Carlos Pérez', 'carlos.perez@fleetcore.com', 'Motor y transmisión', 'ACTIVE', 2);
INSERT INTO public.mechanics VALUES (2, 'Laura Gómez', 'laura.gomez@fleetcore.com', 'Frenos y suspensión', 'ACTIVE', 3);
INSERT INTO public.mechanics VALUES (3, 'Pedro Ruiz', 'pedro.ruiz@fleetcore.com', 'Electricidad automotriz', 'INACTIVE', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (1, 'admin@fleetcore.com', '$2a$10$3Lb9.xLGbnLMWWs8EaZ6oujW09QFJMRpgbpGVWQRLcBo0IYBERrom', 'Admin FleetCore', 'ADMIN', true, '2026-10-27 23:38:20.971522');
INSERT INTO public.users VALUES (2, 'tech1@fleetcore.com', '$2a$10$YMvrUBBAUUEJqaJUEwjlDO0WW3ZneuGgcBsHqpHa4n/cOF97pOM7C', 'Carlos Pérez', 'TECHNICIAN', true, '2026-10-27 23:38:21.066186');
INSERT INTO public.users VALUES (3, 'tech2@fleetcore.com', '$2a$10$AOfvy2beXZc2RwWrUCAjsOpV0ssv5JBDxXZs9BGWLfCzxaNn9nl9m', 'Laura Gómez', 'TECHNICIAN', true, '2026-10-27 23:38:21.166383');


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.vehicles VALUES (1, 'ABC123', 'Chevrolet', 'NPR', 2020, 45000, 'AVAILABLE', '2026-10-27 23:38:21.187345', '2026-10-27 23:38:21.187345');
INSERT INTO public.vehicles VALUES (2, 'DEF456', 'Hino', '300', 2021, 32000, 'AVAILABLE', '2026-10-27 23:38:21.190658', '2026-10-27 23:38:21.190658');
INSERT INTO public.vehicles VALUES (3, 'GHI789', 'Isuzu', 'NHR', 2019, 78000, 'IN_MAINTENANCE', '2026-10-27 23:38:21.192845', '2026-10-27 23:38:21.192845');
INSERT INTO public.vehicles VALUES (4, 'JKL012', 'Foton', 'Aumark', 2015, 150000, 'INACTIVE', '2026-10-27 23:38:21.194859', '2026-10-27 23:38:21.194859');


--
-- Data for Name: workshops; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workshops VALUES (1, 'Taller Centro', 'Cra 43 # 30-15, Barranquilla', 'ACTIVE');
INSERT INTO public.workshops VALUES (2, 'Taller Norte', 'Calle 85 # 50-20, Barranquilla', 'INACTIVE');


--
-- Name: maintenance_status_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.maintenance_status_logs_id_seq', 5, true);


--
-- Name: maintenances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.maintenances_id_seq', 2, true);


--
-- Name: mechanics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mechanics_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: vehicles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicles_id_seq', 4, true);


--
-- Name: workshops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.workshops_id_seq', 2, true);


--
-- Name: maintenance_status_logs PK_08d4922ce507b9f184dd302ba70; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_status_logs
    ADD CONSTRAINT "PK_08d4922ce507b9f184dd302ba70" PRIMARY KEY (id);


--
-- Name: vehicles PK_18d8646b59304dce4af3a9e35b6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY (id);


--
-- Name: mechanics PK_2c0ed23afc0cc7ff361c17e53df; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "PK_2c0ed23afc0cc7ff361c17e53df" PRIMARY KEY (id);


--
-- Name: maintenances PK_62403473bd524a42d58589aa78b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "PK_62403473bd524a42d58589aa78b" PRIMARY KEY (id);


--
-- Name: workshops PK_6d0e82a124f5b53df91c8989848; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops
    ADD CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: mechanics REL_4e69c5d1d5ef843a571535ccfd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "REL_4e69c5d1d5ef843a571535ccfd" UNIQUE (user_id);


--
-- Name: mechanics UQ_301c3b5fa2d49aab65dcfda36a6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "UQ_301c3b5fa2d49aab65dcfda36a6" UNIQUE (email);


--
-- Name: workshops UQ_84a8c763773a6482ba066f608c3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops
    ADD CONSTRAINT "UQ_84a8c763773a6482ba066f608c3" UNIQUE (name);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: vehicles UQ_ec7181ebdab798d97070122a5bf; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "UQ_ec7181ebdab798d97070122a5bf" UNIQUE (plate);


--
-- Name: IDX_4db46f300d630eceb222c1e9b3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4db46f300d630eceb222c1e9b3" ON public.maintenances USING btree ("mechanicId", "scheduledStart", "scheduledEnd");


--
-- Name: IDX_8447c993db1e7f1833847445c0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8447c993db1e7f1833847445c0" ON public.maintenances USING btree ("vehicleId", status);


--
-- Name: maintenance_status_logs FK_0a46e7417830162bdaab7d4a2a9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_status_logs
    ADD CONSTRAINT "FK_0a46e7417830162bdaab7d4a2a9" FOREIGN KEY ("changedById") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: maintenance_status_logs FK_0f82b04b232c63820295efa9641; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_status_logs
    ADD CONSTRAINT "FK_0f82b04b232c63820295efa9641" FOREIGN KEY ("maintenanceId") REFERENCES public.maintenances(id) ON DELETE CASCADE;


--
-- Name: maintenances FK_3a9ba7c05e1ffba00560d11f364; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_3a9ba7c05e1ffba00560d11f364" FOREIGN KEY ("mechanicId") REFERENCES public.mechanics(id) ON DELETE RESTRICT;


--
-- Name: mechanics FK_4e69c5d1d5ef843a571535ccfde; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "FK_4e69c5d1d5ef843a571535ccfde" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: maintenances FK_75331cd2a0f0c22bcb2fc4f6d6a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_75331cd2a0f0c22bcb2fc4f6d6a" FOREIGN KEY ("workshopId") REFERENCES public.workshops(id) ON DELETE RESTRICT;


--
-- Name: maintenances FK_daa193fdfccde41a2ed4de8a474; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_daa193fdfccde41a2ed4de8a474" FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict E4GJerwYtT36wWDPQLVmJFQg4V5n4aXahmfLzBFFaQA8L0n3nxRAgDGumJHMQqY


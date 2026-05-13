--
-- PostgreSQL database dump
--

\restrict RongQzAmqMKSptBE8wGTGtsanUeD0x15OcfV5FzjffPBcolXPNM0Sh5FGHMghTs

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: acr_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acr_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    label text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    body character varying(5000) NOT NULL,
    audience character varying(500) DEFAULT 'all'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT announcements_audience_check CHECK (((audience)::text = ANY (ARRAY[('all'::character varying)::text, ('faculty'::character varying)::text, ('hod'::character varying)::text, ('dean'::character varying)::text, ('non_teaching_staff'::character varying)::text])))
);


--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: appraisal_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appraisal_config (
    id integer NOT NULL,
    academic_year character varying NOT NULL,
    is_open boolean DEFAULT false NOT NULL,
    submission_start timestamp with time zone,
    submission_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: appraisal_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.appraisal_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: appraisal_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.appraisal_config_id_seq OWNED BY public.appraisal_config.id;


--
-- Name: appraisal_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appraisal_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section text NOT NULL,
    section_title text,
    max_marks numeric,
    row_no integer,
    doc_key text,
    file_name text NOT NULL,
    file_type text,
    file_url text,
    storage_path text,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: appraisal_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appraisal_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    reviewer_email text,
    reviewer_role text NOT NULL,
    part_a_score numeric DEFAULT 0 NOT NULL,
    part_b_score numeric DEFAULT 0 NOT NULL,
    total_score numeric DEFAULT 0 NOT NULL,
    remarks text,
    section_scores jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text NOT NULL,
    reviewed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT appraisal_reviews_reviewer_role_check CHECK ((reviewer_role = ANY (ARRAY['hod'::text, 'center_head'::text, 'director'::text, 'dean'::text, 'vc'::text])))
);


--
-- Name: appraisal_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appraisal_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: awards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.awards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    title text,
    award_date date,
    agency text,
    level text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: book_publications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_publications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    title text,
    book text,
    issn text,
    isbn text,
    publisher text,
    coauthor text,
    first_author text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    title text,
    type text,
    organization text,
    level text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: course_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    course text,
    title text,
    details text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT course_files_details_check CHECK (((details IS NULL) OR (details = ANY (ARRAY['1.Available'::text, '2.Partially Available'::text, '3.Not Available'::text]))))
);


--
-- Name: declarations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.declarations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    part_a_total numeric DEFAULT 0 NOT NULL,
    part_b_total numeric DEFAULT 0 NOT NULL,
    grand_total numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'Pending Review'::text NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: department_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.department_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    activity text,
    nature text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: external_research_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_research_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    title text,
    agency text,
    sanction_date date,
    amount numeric,
    role text,
    project_status text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: faculty_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faculty_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text,
    employee_id text,
    full_name text NOT NULL,
    qualification text,
    designation text,
    department text,
    school text,
    teaching_experience text,
    phone text,
    academic_year text,
    appraisal_role text DEFAULT 'faculty'::text NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    avatar text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    reports_to_registrar boolean DEFAULT false NOT NULL,
    CONSTRAINT faculty_profiles_appraisal_role_check CHECK ((appraisal_role = ANY (ARRAY['faculty'::text, 'hod'::text, 'center_head'::text, 'director'::text, 'dean'::text, 'vc'::text, 'non_teaching_staff'::text, 'reporting_officer'::text, 'section_head'::text, 'registrar'::text, 'staff'::text, 'admin'::text])))
);


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(80),
    email character varying(254) NOT NULL,
    category character varying NOT NULL,
    subject character varying(120) NOT NULL,
    message character varying(5000) NOT NULL,
    status character varying DEFAULT 'new'::character varying NOT NULL,
    ip_address character varying,
    user_agent character varying(512),
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feedback_category_check CHECK (((category)::text = ANY ((ARRAY['query'::character varying, 'feedback'::character varying, 'bug'::character varying, 'suggestion'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: form_section_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_section_definitions (
    code text NOT NULL,
    form_family text NOT NULL,
    part text NOT NULL,
    section_key text NOT NULL,
    title text NOT NULL,
    max_marks numeric NOT NULL,
    storage_table text,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ict_pedagogy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ict_pedagogy (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    title text,
    description text,
    type text,
    quadrant text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: industrial_training; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.industrial_training (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    company text,
    duration text,
    nature text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: industry_connect; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.industry_connect (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    name text,
    details text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: innovative_teaching; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.innovative_teaching (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    details text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ipr_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ipr_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    title text,
    scope text,
    ipr_date date,
    ipr_status text,
    file_no text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: journal_publications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_publications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    title text,
    journal text,
    issn text,
    indexing text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: module_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.module_config (
    id integer DEFAULT 1 NOT NULL,
    appraisal_module_enabled boolean DEFAULT true NOT NULL,
    self_appraisal_enabled boolean DEFAULT true NOT NULL,
    peer_review_enabled boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: non_teaching_appraisals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.non_teaching_appraisals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_email text NOT NULL,
    academic_year text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'Draft'::text NOT NULL,
    self_total numeric DEFAULT 0 NOT NULL,
    ro_total numeric DEFAULT 0 NOT NULL,
    registrar_total numeric DEFAULT 0 NOT NULL,
    vc_total numeric DEFAULT 0 NOT NULL,
    submitted_at timestamp with time zone,
    ro_reviewed_at timestamp with time zone,
    registrar_reviewed_at timestamp with time zone,
    vc_reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT non_teaching_appraisals_status_check CHECK ((status = ANY (ARRAY['Draft'::text, 'Submitted'::text, 'Reporting Officer Reviewed'::text, 'Registrar Reviewed'::text, 'VC Approved'::text])))
);


--
-- Name: non_teaching_part_a_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.non_teaching_part_a_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_email text NOT NULL,
    academic_year text NOT NULL,
    item_key text NOT NULL,
    title text NOT NULL,
    max_marks numeric NOT NULL,
    details text,
    self_marks numeric,
    ro_marks numeric,
    registrar_marks numeric,
    vc_marks numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: non_teaching_part_b_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.non_teaching_part_b_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_email text NOT NULL,
    academic_year text NOT NULL,
    section_key text NOT NULL,
    section_title text NOT NULL,
    max_marks numeric NOT NULL,
    parameter_no integer NOT NULL,
    parameter_label text NOT NULL,
    ro_rating numeric,
    registrar_rating numeric,
    vc_rating numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: patents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    title text,
    type text,
    scope text,
    patent_date date,
    patent_status text,
    file_no text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: popular_writings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.popular_writings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    media text,
    film text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products_developed; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products_developed (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    details text,
    usage text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: projects_guided; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects_guided (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    label text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: qualification_enhancement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qualification_enhancement (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    label text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: research_guidance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.research_guidance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    degree text,
    student_name text,
    thesis text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: research_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.research_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    title text,
    agency text,
    sanction_date date,
    amount numeric,
    role text,
    project_status text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: research_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.research_proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    title text,
    duration text,
    agency text,
    amount numeric,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: self_development; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.self_development (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    program text,
    duration text,
    organization text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: social_contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_contributions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    activity text,
    status text,
    details text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    course_code text,
    feedback_1 numeric DEFAULT 0 NOT NULL,
    feedback_2 numeric DEFAULT 0 NOT NULL,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: teaching_process; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teaching_process (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    semester text,
    course_code text,
    planned_classes numeric DEFAULT 0 NOT NULL,
    conducted_classes numeric DEFAULT 0 NOT NULL,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: university_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.university_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_email text NOT NULL,
    academic_year text NOT NULL,
    form_family text,
    section_title text,
    max_marks numeric,
    row_no integer,
    activity text,
    nature text,
    score numeric DEFAULT 0 NOT NULL,
    hod_score numeric,
    director_score numeric,
    dean_score numeric,
    vc_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: appraisal_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_config ALTER COLUMN id SET DEFAULT nextval('public.appraisal_config_id_seq'::regclass);


--
-- Data for Name: acr_scores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.acr_scores (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, label, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
a8a2c568-24a1-4e9b-80f3-843cedcad24a	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	1	Self-motivation and Proactiveness	0	\N	\N	\N	\N	2026-05-11 11:40:48.9629+00	2026-05-11 11:40:48.962905+00
bf13de63-2c4f-452e-aec6-a5528a2a7249	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	2	Punctuality	0	\N	\N	\N	\N	2026-05-11 11:40:48.962915+00	2026-05-11 11:40:48.962917+00
ca1db76d-b0f4-4420-a52b-53080a26acb4	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	3	Target based work	0	\N	\N	\N	\N	2026-05-11 11:40:48.962924+00	2026-05-11 11:40:48.962926+00
81d162ea-a597-4d5d-855a-46fc622dac52	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	4	Effectiveness	0	\N	\N	\N	\N	2026-05-11 11:40:48.962932+00	2026-05-11 11:40:48.962934+00
c14aa511-76bc-4da3-a859-e41b50932ad4	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	5	Obedience	0	\N	\N	\N	\N	2026-05-11 11:40:48.96294+00	2026-05-11 11:40:48.962942+00
72cb5303-dc8a-470d-96c7-714b5ef7134a	samarthgangji2405@gmail.com	2025-2026	standard	Annual Confidential Report - School Level	\N	1	Self-motivation and Proactiveness	0	\N	\N	\N	\N	2026-05-12 04:49:02.042979+00	2026-05-12 04:49:02.042984+00
897493a9-24b5-4dfe-8d9b-4c8d0ef697e2	samarthgangji2405@gmail.com	2025-2026	standard	Annual Confidential Report - School Level	\N	2	Punctuality	0	\N	\N	\N	\N	2026-05-12 04:49:02.042995+00	2026-05-12 04:49:02.042996+00
ffb77fca-8ce2-44c7-ad1c-35c9b96653da	samarthgangji2405@gmail.com	2025-2026	standard	Annual Confidential Report - School Level	\N	3	Target based work	0	\N	\N	\N	\N	2026-05-12 04:49:02.043003+00	2026-05-12 04:49:02.043005+00
5fef110e-c0bf-4a30-9fb1-acad20010a6a	samarthgangji2405@gmail.com	2025-2026	standard	Annual Confidential Report - School Level	\N	4	Effectiveness	0	\N	\N	\N	\N	2026-05-12 04:49:02.043011+00	2026-05-12 04:49:02.043013+00
debba721-0259-4bdd-9633-ade745dcdd2c	samarthgangji2405@gmail.com	2025-2026	standard	Annual Confidential Report - School Level	\N	5	Obedience	0	\N	\N	\N	\N	2026-05-12 04:49:02.043019+00	2026-05-12 04:49:02.043021+00
9fbec617-0e62-4eae-8508-52c59c709281	providence2405@gmail.com	2025-2026	standard	Annual Confidential Report - School Level	\N	1	Self-motivation and Proactiveness	0	\N	22	\N	\N	2026-05-12 05:28:21.115919+00	2026-05-12 05:32:07.378122+00
1b332bd4-2e03-4141-80f4-0febaa6e768c	providence2405@gmail.com	2025-2026	standard	Annual Confidential Report - School Level	\N	2	Punctuality	0	\N	22	\N	\N	2026-05-12 05:28:21.115938+00	2026-05-12 05:32:07.378122+00
f4d124f6-1966-4db9-bfde-94fcd0038651	providence2405@gmail.com	2025-2026	standard	Annual Confidential Report - School Level	\N	3	Target based work	0	\N	22	\N	\N	2026-05-12 05:28:21.115948+00	2026-05-12 05:32:07.378122+00
5b96e2f2-d67b-4375-987b-e6cd7788071d	providence2405@gmail.com	2025-2026	standard	Annual Confidential Report - School Level	\N	4	Effectiveness	0	\N	22	\N	\N	2026-05-12 05:28:21.115956+00	2026-05-12 05:32:07.378122+00
829b00aa-6240-4a62-b31f-a634ef8838e1	providence2405@gmail.com	2025-2026	standard	Annual Confidential Report - School Level	\N	5	Obedience	0	\N	22	\N	\N	2026-05-12 05:28:21.115964+00	2026-05-12 05:32:07.378122+00
7ccdbd60-a4b3-4fd5-889b-d69532cda3b3	pravin.gorde@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	1	Self-motivation and Proactiveness	0	\N	\N	\N	\N	2026-05-11 13:14:03.45547+00	2026-05-11 13:14:03.455476+00
b67affe9-86cf-425b-ac86-865c6a62347b	pravin.gorde@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	2	Punctuality	0	\N	\N	\N	\N	2026-05-11 13:14:03.455485+00	2026-05-11 13:14:03.455487+00
0a058387-33de-4500-a9bf-81eaf745ad2a	pravin.gorde@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	3	Target based work	0	\N	\N	\N	\N	2026-05-11 13:14:03.455494+00	2026-05-11 13:14:03.455495+00
64be413a-213c-4348-b8f9-3c961fc552be	pravin.gorde@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	4	Effectiveness	0	\N	\N	\N	\N	2026-05-11 13:14:03.455502+00	2026-05-11 13:14:03.455503+00
abbe733d-de57-4358-91c1-d3cea08ef751	pravin.gorde@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	5	Obedience	0	\N	\N	\N	\N	2026-05-11 13:14:03.45551+00	2026-05-11 13:14:03.455512+00
453772dc-64b3-4ec5-aa49-dd982f8d280b	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	1	Self-motivation and Proactiveness	0	22	25	25	\N	2026-05-11 11:51:53.686159+00	2026-05-12 04:56:59.745212+00
f71d5376-daf7-4b3d-ba0b-04da5e844496	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	2	Punctuality	0	22	25	25	\N	2026-05-11 11:51:53.686174+00	2026-05-12 04:56:59.745212+00
1cab1f28-1d18-487c-95a5-79fc30275954	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	3	Target based work	0	22	25	25	\N	2026-05-11 11:51:53.686182+00	2026-05-12 04:56:59.745212+00
77ee399c-a419-429c-b121-e6e98b4e5bab	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	4	Effectiveness	0	22	25	25	\N	2026-05-11 11:51:53.68619+00	2026-05-12 04:56:59.745212+00
2a1f00f1-b86b-4eb8-96f6-0469eb94d7bc	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	5	Obedience	0	22	25	25	\N	2026-05-11 11:51:53.686197+00	2026-05-12 04:56:59.745212+00
4f4f9858-9c6f-4a2e-afce-ae287596facc	ram.kunwer@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	1	Self-motivation and Proactiveness	0	\N	25	25	\N	2026-05-11 12:12:53.400372+00	2026-05-12 04:59:00.486352+00
1cfc1481-d830-4d1f-9da7-f32c1236b3e1	ram.kunwer@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	2	Punctuality	0	\N	25	25	\N	2026-05-11 12:12:53.400388+00	2026-05-12 04:59:00.486352+00
6afd40d4-b33f-4a9c-99d5-07679b402397	ram.kunwer@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	3	Target based work	0	\N	25	25	\N	2026-05-11 12:12:53.400398+00	2026-05-12 04:59:00.486352+00
665f4f7b-786b-418e-809c-8dacb3bbe43d	ram.kunwer@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	4	Effectiveness	0	\N	25	25	\N	2026-05-11 12:12:53.400406+00	2026-05-12 04:59:00.486352+00
8d68ba37-f7c8-4940-956e-8d7d334cf55b	ram.kunwer@dypiu.ac.in	2025-2026	standard	Annual Confidential Report - School Level	\N	5	Obedience	0	\N	25	25	\N	2026-05-11 12:12:53.400413+00	2026-05-12 04:59:00.486352+00
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcements (id, title, body, audience, is_active, created_by, created_at, updated_at) FROM stdin;
1	testing	Testing	faculty	t	ruhandave2003@gmail.com	2026-05-12 05:53:46.777883+00	2026-05-12 05:53:46.777903+00
\.


--
-- Data for Name: appraisal_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appraisal_config (id, academic_year, is_open, submission_start, submission_end, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: appraisal_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appraisal_documents (id, faculty_email, academic_year, form_family, section, section_title, max_marks, row_no, doc_key, file_name, file_type, file_url, storage_path, uploaded_at, created_at, updated_at) FROM stdin;
f127d517-7336-46ce-94e7-1997db9c57a2	tejashri.gulve@dypiu.ac.in	2025-2026	\N	lec-	\N	\N	1	lec-0	Tejashri Satish Gulve_Structural Analysis (Theory)-(A)  (1).pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-0/1d72db37-4404-48af-8b46-86e7adfdd818_Tejashri_Satish_Gulve_Structural_Analysis_%28Theory%29-%28A%29__%281%29.pdf	faculty-appraisal/lec-0/1d72db37-4404-48af-8b46-86e7adfdd818_Tejashri_Satish_Gulve_Structural_Analysis_(Theory)-(A)__(1).pdf	2026-05-11 11:40:49.185433+00	2026-05-11 11:40:49.185438+00	2026-05-11 11:40:49.185441+00
7e567abe-331c-428c-87fa-7a2fe1d9482a	tejashri.gulve@dypiu.ac.in	2025-2026	\N	courseFile-	\N	\N	1	courseFile-0	Course File Content.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/courseFile-0/66ff5d21-1e4d-4979-9551-6b64caae9c7a_Course_File_Content.docx	faculty-appraisal/courseFile-0/66ff5d21-1e4d-4979-9551-6b64caae9c7a_Course_File_Content.docx	2026-05-11 11:40:49.185451+00	2026-05-11 11:40:49.185453+00	2026-05-11 11:40:49.185454+00
defa4c68-c4be-47c9-b759-a1aee5ad478e	tejashri.gulve@dypiu.ac.in	2025-2026	\N	innov-	\N	\N	1	innov-0	TSG_ICT TOOLS_AY 25-26, SEM II.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-0/eaab0084-8461-4d05-86ef-151dce779cf0_TSG_ICT_TOOLS_AY_25-26%2C_SEM_II.pdf	faculty-appraisal/innov-0/eaab0084-8461-4d05-86ef-151dce779cf0_TSG_ICT_TOOLS_AY_25-26,_SEM_II.pdf	2026-05-11 11:40:49.185462+00	2026-05-11 11:40:49.185464+00	2026-05-11 11:40:49.185465+00
2dea5efb-9785-4bd5-af2c-b8ae818ea461	tejashri.gulve@dypiu.ac.in	2025-2026	\N	dept-	\N	\N	1	dept-0	Guest Lecture Report  Ultra Tech Cement.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/dept-0/0239f5f3-8151-46e8-96c9-499185e6476c_Guest_Lecture_Report__Ultra_Tech_Cement.pdf	faculty-appraisal/dept-0/0239f5f3-8151-46e8-96c9-499185e6476c_Guest_Lecture_Report__Ultra_Tech_Cement.pdf	2026-05-11 11:40:49.185472+00	2026-05-11 11:40:49.185473+00	2026-05-11 11:40:49.185475+00
bba10f6d-b4ac-487f-b23d-91a13ba8b46c	tejashri.gulve@dypiu.ac.in	2025-2026	\N	uni-	\N	\N	1	uni-0	INnovation order.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-0/1860960c-4712-47be-bdaa-d93fc36d9eba_INnovation_order.pdf	faculty-appraisal/uni-0/1860960c-4712-47be-bdaa-d93fc36d9eba_INnovation_order.pdf	2026-05-11 11:40:49.185481+00	2026-05-11 11:40:49.185483+00	2026-05-11 11:40:49.185484+00
5fe21c91-5758-47dd-8a87-bfd85c8bc041	tejashri.gulve@dypiu.ac.in	2025-2026	\N	ind-	\N	\N	1	ind-0	Guest Lecture Report  Ultra Tech Cement.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-0/4ce6c346-5b54-4b78-bd0f-c9afd97093a4_Guest_Lecture_Report__Ultra_Tech_Cement.pdf	faculty-appraisal/ind-0/4ce6c346-5b54-4b78-bd0f-c9afd97093a4_Guest_Lecture_Report__Ultra_Tech_Cement.pdf	2026-05-11 11:40:49.18549+00	2026-05-11 11:40:49.185492+00	2026-05-11 11:40:49.185493+00
6aa2a68f-a815-476c-b43d-d6bae0093e18	tejashri.gulve@dypiu.ac.in	2025-2026	\N	qual-	\N	\N	1	qual-0	INnovation order.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/qual-0/2ab4af17-4b08-450b-a102-3325eefc62e0_INnovation_order.pdf	faculty-appraisal/qual-0/2ab4af17-4b08-450b-a102-3325eefc62e0_INnovation_order.pdf	2026-05-11 11:40:49.185499+00	2026-05-11 11:40:49.185501+00	2026-05-11 11:40:49.185502+00
c3125d95-d0c6-400d-9cca-d9c26137ac07	tejashri.gulve@dypiu.ac.in	2025-2026	\N	qual-	\N	\N	1	qual-1	PCCOE Conference Certificate (1).pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/qual-1/c368b14e-e5d5-437e-b758-21962c7f3aa2_PCCOE_Conference_Certificate_%281%29.pdf	faculty-appraisal/qual-1/c368b14e-e5d5-437e-b758-21962c7f3aa2_PCCOE_Conference_Certificate_(1).pdf	2026-05-11 11:40:49.185508+00	2026-05-11 11:40:49.18551+00	2026-05-11 11:40:49.185511+00
cc8a68e5-d354-40c2-b797-a33b9bcac072	tejashri.gulve@dypiu.ac.in	2025-2026	\N	soc-	\N	\N	1	soc-6	DRCS SITE VISIT REPORT 17th May..pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/soc-6/7460483b-d4cb-4523-b335-94371c83c367_DRCS_SITE_VISIT_REPORT_17th_May..pdf	faculty-appraisal/soc-6/7460483b-d4cb-4523-b335-94371c83c367_DRCS_SITE_VISIT_REPORT_17th_May..pdf	2026-05-11 11:40:49.185517+00	2026-05-11 11:40:49.185519+00	2026-05-11 11:40:49.18552+00
ae14c178-a6e5-4125-a117-0f6b4a406fcf	tejashri.gulve@dypiu.ac.in	2025-2026	\N	book-	\N	\N	1	book-0	4.NEW  YOGESH(sneha).pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-0/829ce043-dbe6-496a-8eaf-0faf666d91b3_4.NEW__YOGESH%28sneha%29.pdf	faculty-appraisal/book-0/829ce043-dbe6-496a-8eaf-0faf666d91b3_4.NEW__YOGESH(sneha).pdf	2026-05-11 11:40:49.185527+00	2026-05-11 11:40:49.185528+00	2026-05-11 11:40:49.185529+00
ceae52d3-12e5-46fe-affa-fd60869342fb	tejashri.gulve@dypiu.ac.in	2025-2026	\N	ict-	\N	\N	1	ict-0	TSG_ICT TOOLS_AY 25-26, SEM II.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ict-0/109e13cf-0517-4af3-9add-4a2878bf9fa6_TSG_ICT_TOOLS_AY_25-26%2C_SEM_II.pdf	faculty-appraisal/ict-0/109e13cf-0517-4af3-9add-4a2878bf9fa6_TSG_ICT_TOOLS_AY_25-26,_SEM_II.pdf	2026-05-11 11:40:49.185536+00	2026-05-11 11:40:49.185537+00	2026-05-11 11:40:49.185538+00
ef66c94f-e92d-4d2a-90c2-f07f22b318bc	tejashri.gulve@dypiu.ac.in	2025-2026	\N	fdp-	\N	\N	1	fdp-0	certificate1.STTP TSG.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/fdp-0/cd83cb7e-9e49-4c16-8961-4c39ea6a8c9b_certificate1.STTP_TSG.pdf	faculty-appraisal/fdp-0/cd83cb7e-9e49-4c16-8961-4c39ea6a8c9b_certificate1.STTP_TSG.pdf	2026-05-11 11:40:49.185545+00	2026-05-11 11:40:49.185546+00	2026-05-11 11:40:49.185548+00
ad5bda33-7bf3-4317-b969-7aa3fe557294	sunil.dambhare@dypiu.ac.in	2025-2026	\N	lec-	\N	\N	1	lec-0	Computational Theory Lecture Report Sem I AY 2025-26.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-0/0836ddf8-caa8-4907-9c79-264c7ffeabff_Computational_Theory_Lecture_Report_Sem_I_AY_2025-26.pdf	faculty-appraisal/lec-0/0836ddf8-caa8-4907-9c79-264c7ffeabff_Computational_Theory_Lecture_Report_Sem_I_AY_2025-26.pdf	2026-05-11 11:51:53.86357+00	2026-05-11 11:51:53.863575+00	2026-05-11 11:51:53.863577+00
e1103d82-d57c-4e11-b288-4d74fdc3a1c9	sunil.dambhare@dypiu.ac.in	2025-2026	\N	lec-	\N	\N	1	lec-1	Computational Theory Lecture Report Sem I AY 2025-26.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-1/4b21a1f8-7105-44a8-b661-8704254c83e7_Computational_Theory_Lecture_Report_Sem_I_AY_2025-26.pdf	faculty-appraisal/lec-1/4b21a1f8-7105-44a8-b661-8704254c83e7_Computational_Theory_Lecture_Report_Sem_I_AY_2025-26.pdf	2026-05-11 11:51:53.863586+00	2026-05-11 11:51:53.863588+00	2026-05-11 11:51:53.863589+00
29778d03-12a4-4f03-a57d-38f40102191c	sunil.dambhare@dypiu.ac.in	2025-2026	\N	innov-	\N	\N	1	innov-0	Dr Sunil Dambhare End Term TY Computational Techniques End Term(Theory).pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-0/42e32dee-7b81-4819-a4af-ca361571d285_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_End_Term%28Theory%29.pdf	faculty-appraisal/innov-0/42e32dee-7b81-4819-a4af-ca361571d285_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_End_Term(Theory).pdf	2026-05-11 11:51:53.863596+00	2026-05-11 11:51:53.863598+00	2026-05-11 11:51:53.863599+00
ce9b3fa2-6a71-489c-9aca-2e730501790d	sunil.dambhare@dypiu.ac.in	2025-2026	\N	innov-	\N	\N	1	innov-1	Dr Sunil Dambhare End Term TY Computational Techniques Mid Term(Theory).pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-1/75f29d3d-a77b-4bcd-ae8b-bfc45011d9d5_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_Mid_Term%28Theory%29.pdf	faculty-appraisal/innov-1/75f29d3d-a77b-4bcd-ae8b-bfc45011d9d5_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_Mid_Term(Theory).pdf	2026-05-11 11:51:53.863606+00	2026-05-11 11:51:53.863607+00	2026-05-11 11:51:53.863609+00
21097410-82e6-4843-9439-9f9309eb7695	sunil.dambhare@dypiu.ac.in	2025-2026	\N	innov-	\N	\N	1	innov-2	Dr Sunil Dambhare End Term TY Computational Techniques Mid Term(Theory).pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-2/92358acc-04a7-4f4a-be2b-b03b302dcabf_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_Mid_Term%28Theory%29.pdf	faculty-appraisal/innov-2/92358acc-04a7-4f4a-be2b-b03b302dcabf_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_Mid_Term(Theory).pdf	2026-05-11 11:51:53.863615+00	2026-05-11 11:51:53.863616+00	2026-05-11 11:51:53.863618+00
3ff40ae7-8de4-4e9a-ab29-2bd6f91c119c	sunil.dambhare@dypiu.ac.in	2025-2026	\N	innov-	\N	\N	1	innov-3	Dr Sunil Dambhare End Term TY Computational Techniques End Term(Theory).pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-3/67a581fe-29c9-4756-bde0-0391091cbbde_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_End_Term%28Theory%29.pdf	faculty-appraisal/innov-3/67a581fe-29c9-4756-bde0-0391091cbbde_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_End_Term(Theory).pdf	2026-05-11 11:51:53.863624+00	2026-05-11 11:51:53.863626+00	2026-05-11 11:51:53.863627+00
6f0a03fe-f23c-4fc1-8dd4-99ee1db9da36	sunil.dambhare@dypiu.ac.in	2025-2026	\N	dept-	\N	\N	1	dept-0	Department Duties.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/dept-0/3898be8a-d772-48b9-9824-4b86677d87ab_Department_Duties.pdf	faculty-appraisal/dept-0/3898be8a-d772-48b9-9824-4b86677d87ab_Department_Duties.pdf	2026-05-11 11:51:53.863633+00	2026-05-11 11:51:53.863634+00	2026-05-11 11:51:53.863636+00
0766e4fb-d942-4a78-8d68-79788601041b	sunil.dambhare@dypiu.ac.in	2025-2026	\N	uni-	\N	\N	1	uni-0	Department Duties.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-0/6b583844-2860-4645-b222-a1d14a9b0faa_Department_Duties.pdf	faculty-appraisal/uni-0/6b583844-2860-4645-b222-a1d14a9b0faa_Department_Duties.pdf	2026-05-11 11:51:53.863642+00	2026-05-11 11:51:53.863643+00	2026-05-11 11:51:53.863645+00
14700b62-fb40-451c-9ca3-a976f7347bbf	sunil.dambhare@dypiu.ac.in	2025-2026	\N	uni-	\N	\N	1	uni-1	Department Duties.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-1/ab5d7d91-63fc-4b4b-8173-8beb8640c76b_Department_Duties.pdf	faculty-appraisal/uni-1/ab5d7d91-63fc-4b4b-8173-8beb8640c76b_Department_Duties.pdf	2026-05-11 11:51:53.863651+00	2026-05-11 11:51:53.863652+00	2026-05-11 11:51:53.863654+00
aa4da3d4-00e0-4b94-a212-ffe75a3d4628	sunil.dambhare@dypiu.ac.in	2025-2026	\N	soc-	\N	\N	1	soc-0	Department Duties.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/soc-0/9325a397-4ae4-4051-8c2b-b13cba2a25b1_Department_Duties.pdf	faculty-appraisal/soc-0/9325a397-4ae4-4051-8c2b-b13cba2a25b1_Department_Duties.pdf	2026-05-11 11:51:53.86366+00	2026-05-11 11:51:53.863661+00	2026-05-11 11:51:53.863663+00
d3936f31-3fa3-4b5e-8c15-22622c5832be	sunil.dambhare@dypiu.ac.in	2025-2026	\N	ind-	\N	\N	1	ind-0	FDP Paper.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-0/998bf61c-8f12-447e-b367-04877c0b600a_FDP_Paper.pdf	faculty-appraisal/ind-0/998bf61c-8f12-447e-b367-04877c0b600a_FDP_Paper.pdf	2026-05-11 11:51:53.863669+00	2026-05-11 11:51:53.86367+00	2026-05-11 11:51:53.863672+00
a9e70e57-1f18-4a00-b37e-61fe505b053e	sunil.dambhare@dypiu.ac.in	2025-2026	\N	ind-	\N	\N	1	ind-1	effect of grain size paper.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-1/fa7252b5-ee57-4ff5-8547-09d7611a895f_effect_of_grain_size_paper.pdf	faculty-appraisal/ind-1/fa7252b5-ee57-4ff5-8547-09d7611a895f_effect_of_grain_size_paper.pdf	2026-05-11 11:51:53.863678+00	2026-05-11 11:51:53.86368+00	2026-05-11 11:51:53.863681+00
447aa8c1-1735-445d-9c50-8990c54bfa3e	sunil.dambhare@dypiu.ac.in	2025-2026	\N	jour-	\N	\N	1	jour-0	effect of grain size paper.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/jour-0/2fb8a2c6-da1b-4273-883a-c8f5957e8331_effect_of_grain_size_paper.pdf	faculty-appraisal/jour-0/2fb8a2c6-da1b-4273-883a-c8f5957e8331_effect_of_grain_size_paper.pdf	2026-05-11 11:51:53.863687+00	2026-05-11 11:51:53.863689+00	2026-05-11 11:51:53.86369+00
0c7a422d-827c-4a4f-8f23-1826918f713b	sunil.dambhare@dypiu.ac.in	2025-2026	\N	jour-	\N	\N	1	jour-1	effect of grain size paper.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/jour-1/b4452acf-1d44-4cca-85c2-5bb6679e8708_effect_of_grain_size_paper.pdf	faculty-appraisal/jour-1/b4452acf-1d44-4cca-85c2-5bb6679e8708_effect_of_grain_size_paper.pdf	2026-05-11 11:51:53.863696+00	2026-05-11 11:51:53.863697+00	2026-05-11 11:51:53.863699+00
068a6cd7-3833-4494-b5dd-46182b0a1e96	sunil.dambhare@dypiu.ac.in	2025-2026	\N	book-	\N	\N	1	book-0	Evaluation Sheet with components.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-0/c7d95455-e0ab-40d3-8e41-4a0c9b751afb_Evaluation_Sheet_with_components.pdf	faculty-appraisal/book-0/c7d95455-e0ab-40d3-8e41-4a0c9b751afb_Evaluation_Sheet_with_components.pdf	2026-05-11 11:51:53.863705+00	2026-05-11 11:51:53.863706+00	2026-05-11 11:51:53.863708+00
0399c279-3812-4630-94a6-987209a6820d	sunil.dambhare@dypiu.ac.in	2025-2026	\N	book-	\N	\N	1	book-1	Computational Theory Lecture Report Sem I AY 2025-26.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-1/0a42c3b5-371a-462f-8146-fcee76f9134f_Computational_Theory_Lecture_Report_Sem_I_AY_2025-26.pdf	faculty-appraisal/book-1/0a42c3b5-371a-462f-8146-fcee76f9134f_Computational_Theory_Lecture_Report_Sem_I_AY_2025-26.pdf	2026-05-11 11:51:53.863713+00	2026-05-11 11:51:53.863715+00	2026-05-11 11:51:53.863716+00
b78d662a-714e-4143-8f0c-54dbf67524ac	sunil.dambhare@dypiu.ac.in	2025-2026	\N	project2-	\N	\N	1	project2-0	Evaluation Sheet with components.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/project2-0/bab76075-9fe0-45c7-b898-48f41fd406cd_Evaluation_Sheet_with_components.pdf	faculty-appraisal/project2-0/bab76075-9fe0-45c7-b898-48f41fd406cd_Evaluation_Sheet_with_components.pdf	2026-05-11 11:51:53.863722+00	2026-05-11 11:51:53.863724+00	2026-05-11 11:51:53.863725+00
2fd84724-f657-4efe-a0b1-762c442036f4	sunil.dambhare@dypiu.ac.in	2025-2026	\N	externalProject-	\N	\N	1	externalProject-0	FDP Paper.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/externalProject-0/f1f7c8a3-ff3e-46aa-8dea-c5a5e5d04ddc_FDP_Paper.pdf	faculty-appraisal/externalProject-0/f1f7c8a3-ff3e-46aa-8dea-c5a5e5d04ddc_FDP_Paper.pdf	2026-05-11 11:51:53.863732+00	2026-05-11 11:51:53.863733+00	2026-05-11 11:51:53.863735+00
d8f1701b-eda9-40b2-a672-6eb79d330c10	sunil.dambhare@dypiu.ac.in	2025-2026	\N	externalProject-	\N	\N	1	externalProject-1	Department Duties.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/externalProject-1/6f9cd56c-1ecb-43f6-9b5a-33d4e20d82d3_Department_Duties.pdf	faculty-appraisal/externalProject-1/6f9cd56c-1ecb-43f6-9b5a-33d4e20d82d3_Department_Duties.pdf	2026-05-11 11:51:53.863741+00	2026-05-11 11:51:53.863743+00	2026-05-11 11:51:53.863744+00
8223765e-8cbc-412b-a059-6b16ad9688ac	sunil.dambhare@dypiu.ac.in	2025-2026	\N	pat-	\N	\N	1	pat-0	effect of grain size paper.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/pat-0/d9ae694d-432f-4241-9d10-1c23538421ce_effect_of_grain_size_paper.pdf	faculty-appraisal/pat-0/d9ae694d-432f-4241-9d10-1c23538421ce_effect_of_grain_size_paper.pdf	2026-05-11 11:51:53.86375+00	2026-05-11 11:51:53.863752+00	2026-05-11 11:51:53.863753+00
b6ddb1f3-acbd-431d-9708-280291f674cf	sunil.dambhare@dypiu.ac.in	2025-2026	\N	prop-	\N	\N	1	prop-0	Department Duties.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prop-0/13b6596a-85ee-471a-9556-38bd00f217cf_Department_Duties.pdf	faculty-appraisal/prop-0/13b6596a-85ee-471a-9556-38bd00f217cf_Department_Duties.pdf	2026-05-11 11:51:53.86376+00	2026-05-11 11:51:53.863763+00	2026-05-11 11:51:53.863765+00
a17139e7-a438-44ef-97fc-31eff4d635a2	sunil.dambhare@dypiu.ac.in	2025-2026	\N	prod-	\N	\N	1	prod-0	Evaluation Sheet with components.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prod-0/b0e6251f-e759-4890-89c7-30c6aa19894d_Evaluation_Sheet_with_components.pdf	faculty-appraisal/prod-0/b0e6251f-e759-4890-89c7-30c6aa19894d_Evaluation_Sheet_with_components.pdf	2026-05-11 11:51:53.863816+00	2026-05-11 11:51:53.863819+00	2026-05-11 11:51:53.86382+00
5b4caaaf-0234-4d97-b7f0-95f35257757e	sunil.dambhare@dypiu.ac.in	2025-2026	\N	fdp-	\N	\N	1	fdp-0	FDP Paper.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/fdp-0/32e98161-675f-4cd1-bcb6-9bdd36a3c750_FDP_Paper.pdf	faculty-appraisal/fdp-0/32e98161-675f-4cd1-bcb6-9bdd36a3c750_FDP_Paper.pdf	2026-05-11 11:51:53.863832+00	2026-05-11 11:51:53.863833+00	2026-05-11 11:51:53.863835+00
2016da41-6bc2-4885-9f40-904517fbfaa8	sunil.dambhare@dypiu.ac.in	2025-2026	\N	fdp-	\N	\N	1	fdp-1	FDP Paper.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/fdp-1/2845962c-ecc9-4d09-bf0e-853f79741d6b_FDP_Paper.pdf	faculty-appraisal/fdp-1/2845962c-ecc9-4d09-bf0e-853f79741d6b_FDP_Paper.pdf	2026-05-11 11:51:53.863842+00	2026-05-11 11:51:53.863843+00	2026-05-11 11:51:53.863845+00
081ccada-e921-4592-b6a5-287710b07231	ram.kunwer@dypiu.ac.in	2025-2026	\N	lec-	\N	\N	1	lec-0	Lectures, Tutorials, Practicals, Projects.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-0/fb95a9b9-13d2-41d5-8636-395737527ae1_Lectures%2C_Tutorials%2C_Practicals%2C_Projects.pdf	faculty-appraisal/lec-0/fb95a9b9-13d2-41d5-8636-395737527ae1_Lectures,_Tutorials,_Practicals,_Projects.pdf	2026-05-11 12:12:53.576748+00	2026-05-11 12:12:53.576753+00	2026-05-11 12:12:53.576755+00
3ddd3bb0-d415-46d6-911c-144474af86f2	ram.kunwer@dypiu.ac.in	2025-2026	\N	courseFile-	\N	\N	1	courseFile-0	Course File.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/courseFile-0/973e7a4d-4ce7-4d7f-8164-5d7eba2bab82_Course_File.pdf	faculty-appraisal/courseFile-0/973e7a4d-4ce7-4d7f-8164-5d7eba2bab82_Course_File.pdf	2026-05-11 12:12:53.576765+00	2026-05-11 12:12:53.576766+00	2026-05-11 12:12:53.576768+00
1d4f5028-f6a7-4b6d-b881-423e3cc4af67	ram.kunwer@dypiu.ac.in	2025-2026	\N	innov-	\N	\N	1	innov-0	Innovative Teaching-Learning Methodologies.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-0/cecc7489-36a6-4833-aff8-1ae5628a325a_Innovative_Teaching-Learning_Methodologies.pdf	faculty-appraisal/innov-0/cecc7489-36a6-4833-aff8-1ae5628a325a_Innovative_Teaching-Learning_Methodologies.pdf	2026-05-11 12:12:53.576775+00	2026-05-11 12:12:53.576777+00	2026-05-11 12:12:53.576778+00
52e970ca-647b-4c98-84e0-3c37303f0112	ram.kunwer@dypiu.ac.in	2025-2026	\N	proj-	\N	\N	1	proj-0	Projects.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-0/15ab1a34-09b7-488b-85a0-4be5dfbde919_Projects.pdf	faculty-appraisal/proj-0/15ab1a34-09b7-488b-85a0-4be5dfbde919_Projects.pdf	2026-05-11 12:12:53.576785+00	2026-05-11 12:12:53.576786+00	2026-05-11 12:12:53.576788+00
bba14c79-21d6-42f8-95b3-cb5245929828	ram.kunwer@dypiu.ac.in	2025-2026	\N	dept-	\N	\N	1	dept-0	Student Feedback.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/dept-0/8206db10-e54c-43a1-8faa-698e9da2909d_Student_Feedback.pdf	faculty-appraisal/dept-0/8206db10-e54c-43a1-8faa-698e9da2909d_Student_Feedback.pdf	2026-05-11 12:12:53.576794+00	2026-05-11 12:12:53.576796+00	2026-05-11 12:12:53.576797+00
b37717c3-674e-49db-adc9-10ef25d75108	ram.kunwer@dypiu.ac.in	2025-2026	\N	uni-	\N	\N	1	uni-0	University Activities.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-0/cad8e37c-d424-4033-acaf-5c00516a439c_University_Activities.pdf	faculty-appraisal/uni-0/cad8e37c-d424-4033-acaf-5c00516a439c_University_Activities.pdf	2026-05-11 12:12:53.576803+00	2026-05-11 12:12:53.576805+00	2026-05-11 12:12:53.576806+00
875ee8f2-4205-4e99-b4f4-4ebfe99a8266	ram.kunwer@dypiu.ac.in	2025-2026	\N	ind-	\N	\N	1	ind-0	Industry Connect.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-0/4e2cfbc9-85e9-4200-aca5-10e40e4cafcc_Industry_Connect.pdf	faculty-appraisal/ind-0/4e2cfbc9-85e9-4200-aca5-10e40e4cafcc_Industry_Connect.pdf	2026-05-11 12:12:53.576828+00	2026-05-11 12:12:53.57683+00	2026-05-11 12:12:53.576832+00
77b9a6c4-fab4-43ee-9988-a3083e503c79	ram.kunwer@dypiu.ac.in	2025-2026	\N	innov-	\N	\N	1	innov-1	Innovative Teaching-Learning Methodologies.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-1/965e6c74-d483-4615-8fbb-de599e859a67_Innovative_Teaching-Learning_Methodologies.pdf	faculty-appraisal/innov-1/965e6c74-d483-4615-8fbb-de599e859a67_Innovative_Teaching-Learning_Methodologies.pdf	2026-05-11 12:12:53.576842+00	2026-05-11 12:12:53.576844+00	2026-05-11 12:12:53.576845+00
6e0f7464-4025-445c-93aa-42faa55b9646	ram.kunwer@dypiu.ac.in	2025-2026	\N	courseFile-	\N	\N	1	courseFile-1	Course File.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/courseFile-1/9cde5178-1a4d-4d75-b20d-b15ba5ce13e3_Course_File.pdf	faculty-appraisal/courseFile-1/9cde5178-1a4d-4d75-b20d-b15ba5ce13e3_Course_File.pdf	2026-05-11 12:12:53.576852+00	2026-05-11 12:12:53.576854+00	2026-05-11 12:12:53.576856+00
8a67da8f-fe43-490a-b7eb-8344065e861a	ram.kunwer@dypiu.ac.in	2025-2026	\N	courseFile-	\N	\N	1	courseFile-2	Course File.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/courseFile-2/0e2b21ca-22b0-49fe-a63a-b239ef9da57a_Course_File.pdf	faculty-appraisal/courseFile-2/0e2b21ca-22b0-49fe-a63a-b239ef9da57a_Course_File.pdf	2026-05-11 12:12:53.576863+00	2026-05-11 12:12:53.576864+00	2026-05-11 12:12:53.576866+00
052ec392-505f-48d1-bd63-4615d06476b0	ram.kunwer@dypiu.ac.in	2025-2026	\N	lec-	\N	\N	1	lec-1	Lectures, Tutorials, Practicals, Projects.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-1/34d57d32-2333-4596-b183-18509e6c065b_Lectures%2C_Tutorials%2C_Practicals%2C_Projects.pdf	faculty-appraisal/lec-1/34d57d32-2333-4596-b183-18509e6c065b_Lectures,_Tutorials,_Practicals,_Projects.pdf	2026-05-11 12:12:53.576872+00	2026-05-11 12:12:53.576874+00	2026-05-11 12:12:53.576875+00
182311e3-bc85-49a0-be01-cdb2744715d9	ram.kunwer@dypiu.ac.in	2025-2026	\N	proj-	\N	\N	1	proj-1	Projects.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-1/e0fa95fe-e3b4-4396-bc73-bc9a8893d107_Projects.pdf	faculty-appraisal/proj-1/e0fa95fe-e3b4-4396-bc73-bc9a8893d107_Projects.pdf	2026-05-11 12:12:53.576882+00	2026-05-11 12:12:53.576884+00	2026-05-11 12:12:53.576885+00
35e5803f-5fe9-46c4-888e-b3bc446e07b4	ram.kunwer@dypiu.ac.in	2025-2026	\N	proj-	\N	\N	1	proj-2	Projects.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-2/3e9aafa4-2017-47b4-afef-1ab507991ee8_Projects.pdf	faculty-appraisal/proj-2/3e9aafa4-2017-47b4-afef-1ab507991ee8_Projects.pdf	2026-05-11 12:12:53.576892+00	2026-05-11 12:12:53.576893+00	2026-05-11 12:12:53.576895+00
35f05632-5b38-4eff-ba69-c19ac10585c0	ram.kunwer@dypiu.ac.in	2025-2026	\N	proj-	\N	\N	1	proj-3	Projects.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-3/452fa31a-4b06-462f-af02-4483fdfd38d4_Projects.pdf	faculty-appraisal/proj-3/452fa31a-4b06-462f-af02-4483fdfd38d4_Projects.pdf	2026-05-11 12:12:53.576902+00	2026-05-11 12:12:53.576903+00	2026-05-11 12:12:53.576905+00
c3ecbdea-23c2-4454-bd33-625f1414dae8	ram.kunwer@dypiu.ac.in	2025-2026	\N	jour-	\N	\N	1	jour-0	Research Papers.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/jour-0/91953b2f-438e-401a-b986-eb89b643c1a2_Research_Papers.pdf	faculty-appraisal/jour-0/91953b2f-438e-401a-b986-eb89b643c1a2_Research_Papers.pdf	2026-05-11 12:12:53.576911+00	2026-05-11 12:12:53.576912+00	2026-05-11 12:12:53.576914+00
d906ea97-c066-4af3-8ae1-3796f9fe58dc	ram.kunwer@dypiu.ac.in	2025-2026	\N	book-	\N	\N	1	book-0	book.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-0/ea251806-9b8b-49fb-b25d-b4eb8364de4b_book.pdf	faculty-appraisal/book-0/ea251806-9b8b-49fb-b25d-b4eb8364de4b_book.pdf	2026-05-11 12:12:53.576919+00	2026-05-11 12:12:53.576921+00	2026-05-11 12:12:53.576922+00
42d52fc1-1f7a-4dc5-8194-1cc147f77f0a	ram.kunwer@dypiu.ac.in	2025-2026	\N	res-	\N	\N	1	res-0	Research Guidance.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/res-0/4fbf518d-7acc-44ab-9e12-cb64158a86a7_Research_Guidance.pdf	faculty-appraisal/res-0/4fbf518d-7acc-44ab-9e12-cb64158a86a7_Research_Guidance.pdf	2026-05-11 12:12:53.576928+00	2026-05-11 12:12:53.57693+00	2026-05-11 12:12:53.576931+00
d0297017-00dc-411a-83df-c8c365ba6ff1	ram.kunwer@dypiu.ac.in	2025-2026	\N	res-	\N	\N	1	res-1	Research Guidance.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/res-1/9d0d3121-02da-4acc-ae95-3cbca1bfc7e2_Research_Guidance.pdf	faculty-appraisal/res-1/9d0d3121-02da-4acc-ae95-3cbca1bfc7e2_Research_Guidance.pdf	2026-05-11 12:12:53.576937+00	2026-05-11 12:12:53.576939+00	2026-05-11 12:12:53.57694+00
5c690392-15b4-4659-b732-0f826d48c050	ram.kunwer@dypiu.ac.in	2025-2026	\N	conf-	\N	\N	1	conf-0	Invited Lectures.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/conf-0/5eb6e2f8-4998-4e46-961c-6580f62f7964_Invited_Lectures.pdf	faculty-appraisal/conf-0/5eb6e2f8-4998-4e46-961c-6580f62f7964_Invited_Lectures.pdf	2026-05-11 12:12:53.576946+00	2026-05-11 12:12:53.576948+00	2026-05-11 12:12:53.576949+00
20ebac26-0cb6-4a1d-9a1a-2ae1fab20b10	ram.kunwer@dypiu.ac.in	2025-2026	\N	prop-	\N	\N	1	prop-0	Research Papers.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prop-0/98bea9e9-3e11-403f-bcb5-39fbe2f50fe5_Research_Papers.pdf	faculty-appraisal/prop-0/98bea9e9-3e11-403f-bcb5-39fbe2f50fe5_Research_Papers.pdf	2026-05-11 12:12:53.576955+00	2026-05-11 12:12:53.576957+00	2026-05-11 12:12:53.576958+00
6a43deba-88e5-4703-a26b-00caff4f43ff	pravin.gorde@dypiu.ac.in	2025-2026	\N	lec-	\N	\N	1	lec-0	Basic Civil and Construction Engineering (24-5-24).docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-0/e5d8863f-d08d-4203-8cf5-e187e335ac7a_Basic_Civil_and_Construction_Engineering_%2824-5-24%29.docx	faculty-appraisal/lec-0/e5d8863f-d08d-4203-8cf5-e187e335ac7a_Basic_Civil_and_Construction_Engineering_(24-5-24).docx	2026-05-11 13:14:03.597626+00	2026-05-11 13:14:03.597631+00	2026-05-11 13:14:03.597634+00
4aaf006d-4c06-4f23-b583-0ded25ab3515	pravin.gorde@dypiu.ac.in	2025-2026	\N	innov	\N	\N	1	innov	ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov/2c471175-e66d-4e23-b19c-3a1686b9291a_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	faculty-appraisal/innov/2c471175-e66d-4e23-b19c-3a1686b9291a_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	2026-05-11 13:14:03.597647+00	2026-05-11 13:14:03.597648+00	2026-05-11 13:14:03.59765+00
3987b0d8-e624-4df9-89fc-2c50264c0e39	pravin.gorde@dypiu.ac.in	2025-2026	\N	proj-	\N	\N	1	proj-0	ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-0/87a411dc-9cd6-4a07-b423-d13432a47d8e_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	faculty-appraisal/proj-0/87a411dc-9cd6-4a07-b423-d13432a47d8e_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	2026-05-11 13:14:03.597667+00	2026-05-11 13:14:03.597669+00	2026-05-11 13:14:03.597671+00
53f9e07f-3da5-4d78-8690-a17f23ef1e70	pravin.gorde@dypiu.ac.in	2025-2026	\N	proj-	\N	\N	1	proj-1	ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-1/12bca49a-566d-4c3a-8051-3db8e5fd6950_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	faculty-appraisal/proj-1/12bca49a-566d-4c3a-8051-3db8e5fd6950_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	2026-05-11 13:14:03.597691+00	2026-05-11 13:14:03.597694+00	2026-05-11 13:14:03.597696+00
de39cecf-543b-41e2-90f3-5e8e91d99789	pravin.gorde@dypiu.ac.in	2025-2026	\N	proj-	\N	\N	1	proj-3	Assignment 1.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-3/4e227b9e-2076-4e93-b6d0-9c23cbc5e7f2_Assignment_1.docx	faculty-appraisal/proj-3/4e227b9e-2076-4e93-b6d0-9c23cbc5e7f2_Assignment_1.docx	2026-05-11 13:14:03.597707+00	2026-05-11 13:14:03.597709+00	2026-05-11 13:14:03.59771+00
8ca66be7-82dd-4a8a-8770-895c9bf4a8d2	pravin.gorde@dypiu.ac.in	2025-2026	\N	qual-	\N	\N	1	qual-0	Basic Civil and Construction Engineering (24-5-24).docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/qual-0/c332b745-380a-4bb8-9aa5-ce70c0ce9637_Basic_Civil_and_Construction_Engineering_%2824-5-24%29.docx	faculty-appraisal/qual-0/c332b745-380a-4bb8-9aa5-ce70c0ce9637_Basic_Civil_and_Construction_Engineering_(24-5-24).docx	2026-05-11 13:14:03.597717+00	2026-05-11 13:14:03.597719+00	2026-05-11 13:14:03.59772+00
a3554323-a3dd-4cba-a455-a598e9e02408	pravin.gorde@dypiu.ac.in	2025-2026	\N	qual-	\N	\N	1	qual-1	Assignment 1.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/qual-1/38d55165-c92a-4b8a-9ee0-13b67b35123f_Assignment_1.docx	faculty-appraisal/qual-1/38d55165-c92a-4b8a-9ee0-13b67b35123f_Assignment_1.docx	2026-05-11 13:14:03.597745+00	2026-05-11 13:14:03.597747+00	2026-05-11 13:14:03.597756+00
793a7aa0-fcc8-49a1-98d0-cd0771d486d5	pravin.gorde@dypiu.ac.in	2025-2026	\N	dept-	\N	\N	1	dept-0	Assignment 1.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/dept-0/8db0fcd5-6c82-47ad-843a-c14bfde7e937_Assignment_1.docx	faculty-appraisal/dept-0/8db0fcd5-6c82-47ad-843a-c14bfde7e937_Assignment_1.docx	2026-05-11 13:14:03.597771+00	2026-05-11 13:14:03.597772+00	2026-05-11 13:14:03.597774+00
4489a6b0-53a0-4d7a-b3d9-b244f2acaad0	pravin.gorde@dypiu.ac.in	2025-2026	\N	uni-	\N	\N	1	uni-0	ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-0/58d9c8fe-5e05-4f91-90a6-adcf5d1e6f3d_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	faculty-appraisal/uni-0/58d9c8fe-5e05-4f91-90a6-adcf5d1e6f3d_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	2026-05-11 13:14:03.597782+00	2026-05-11 13:14:03.597783+00	2026-05-11 13:14:03.597785+00
d6ed2445-6d13-41b4-81fd-9b4446a8bae0	pravin.gorde@dypiu.ac.in	2025-2026	\N	ind-	\N	\N	1	ind-0	ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-0/e5863e55-0b0b-4858-b6c1-183c5354492f_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	faculty-appraisal/ind-0/e5863e55-0b0b-4858-b6c1-183c5354492f_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	2026-05-11 13:14:03.597791+00	2026-05-11 13:14:03.597793+00	2026-05-11 13:14:03.597794+00
3f2b716b-b146-4c66-89c8-84549de7ab9a	pravin.gorde@dypiu.ac.in	2025-2026	\N	proj-	\N	\N	1	proj-2	ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-2/94108780-7fe0-43b1-b678-1a3cc01ddd34_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	faculty-appraisal/proj-2/94108780-7fe0-43b1-b678-1a3cc01ddd34_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	2026-05-11 13:14:03.597801+00	2026-05-11 13:14:03.597802+00	2026-05-11 13:14:03.597804+00
362d3492-8273-40cc-bc9f-0929e03539cd	pravin.gorde@dypiu.ac.in	2025-2026	\N	soc-	\N	\N	1	soc-0	ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/soc-0/cba10799-db21-4e34-a724-2688cbc484ea_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	faculty-appraisal/soc-0/cba10799-db21-4e34-a724-2688cbc484ea_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	2026-05-11 13:14:03.59781+00	2026-05-11 13:14:03.597812+00	2026-05-11 13:14:03.597813+00
b1ab3f63-d684-454a-b3f7-c5e17d9b0e8b	pravin.gorde@dypiu.ac.in	2025-2026	\N	soc-	\N	\N	1	soc-1	ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/soc-1/dfc95f18-00f8-401d-9012-542082ef2187_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	faculty-appraisal/soc-1/dfc95f18-00f8-401d-9012-542082ef2187_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx	2026-05-11 13:14:03.597819+00	2026-05-11 13:14:03.597821+00	2026-05-11 13:14:03.597822+00
39ba4e05-c6e5-42f1-9643-052252b40812	pravin.gorde@dypiu.ac.in	2025-2026	\N	jour-	\N	\N	1	jour-0	Design+of+3+Axis+3D+Printing+of+Concrete+final+(1).pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/jour-0/c81d3c66-3234-47ad-8ba6-fe66642139c5_Design%2Bof%2B3%2BAxis%2B3D%2BPrinting%2Bof%2BConcrete%2Bfinal%2B%281%29.pdf	faculty-appraisal/jour-0/c81d3c66-3234-47ad-8ba6-fe66642139c5_Design+of+3+Axis+3D+Printing+of+Concrete+final+(1).pdf	2026-05-11 13:14:03.597829+00	2026-05-11 13:14:03.59783+00	2026-05-11 13:14:03.597832+00
3d5c6978-55c2-4ddf-8293-173106ca9b55	pravin.gorde@dypiu.ac.in	2025-2026	\N	book-	\N	\N	1	book-0	Design+of+3+Axis+3D+Printing+of+Concrete+final+(1).pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-0/252d69de-64d8-4f98-aff7-53038c1090ae_Design%2Bof%2B3%2BAxis%2B3D%2BPrinting%2Bof%2BConcrete%2Bfinal%2B%281%29.pdf	faculty-appraisal/book-0/252d69de-64d8-4f98-aff7-53038c1090ae_Design+of+3+Axis+3D+Printing+of+Concrete+final+(1).pdf	2026-05-11 13:14:03.597838+00	2026-05-11 13:14:03.59784+00	2026-05-11 13:14:03.597841+00
15ff98e9-e6a2-4ffc-88f8-7c5f93746b21	pravin.gorde@dypiu.ac.in	2025-2026	\N	ict-	\N	\N	1	ict-0	Assignment 1.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ict-0/ec1cc0bf-2685-4e02-9356-1ae99323dd00_Assignment_1.docx	faculty-appraisal/ict-0/ec1cc0bf-2685-4e02-9356-1ae99323dd00_Assignment_1.docx	2026-05-11 13:14:03.597847+00	2026-05-11 13:14:03.597849+00	2026-05-11 13:14:03.59785+00
36394d7f-403a-4ba9-a67e-45faf7930d0c	pravin.gorde@dypiu.ac.in	2025-2026	\N	externalProject-	\N	\N	1	externalProject-0	Assignment 1.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/externalProject-0/8594064b-b648-404c-afc5-eba336dd1a47_Assignment_1.docx	faculty-appraisal/externalProject-0/8594064b-b648-404c-afc5-eba336dd1a47_Assignment_1.docx	2026-05-11 13:14:03.597856+00	2026-05-11 13:14:03.597857+00	2026-05-11 13:14:03.597859+00
cbde6346-5681-43f2-ae0b-947a799dab09	pravin.gorde@dypiu.ac.in	2025-2026	\N	conf-	\N	\N	1	conf-0	Assignment 1.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/conf-0/db28394b-441f-4187-ba15-36c8f80df7b6_Assignment_1.docx	faculty-appraisal/conf-0/db28394b-441f-4187-ba15-36c8f80df7b6_Assignment_1.docx	2026-05-11 13:14:03.597866+00	2026-05-11 13:14:03.597867+00	2026-05-11 13:14:03.597868+00
70f04614-73c2-4a18-9856-bd05bea5777f	pravin.gorde@dypiu.ac.in	2025-2026	\N	fdp-	\N	\N	1	fdp-0	Assignment 1.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/fdp-0/d136f590-4b8a-4c9f-9d22-052556ffa2a6_Assignment_1.docx	faculty-appraisal/fdp-0/d136f590-4b8a-4c9f-9d22-052556ffa2a6_Assignment_1.docx	2026-05-11 13:14:03.597875+00	2026-05-11 13:14:03.597876+00	2026-05-11 13:14:03.597878+00
3953686c-fd27-474b-b90f-d467f822d590	samarthgangji2405@gmail.com	2025-2026	\N	lec-	\N	\N	1	lec-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-0/55d25c55-e0cf-4317-9c61-350734cf84b3_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/lec-0/55d25c55-e0cf-4317-9c61-350734cf84b3_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 04:49:02.146131+00	2026-05-12 04:49:02.146137+00	2026-05-12 04:49:02.146139+00
ffdb9565-b6c3-4a50-95b3-da99a35b4121	samarthgangji2405@gmail.com	2025-2026	\N	innov-	\N	\N	1	innov-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-0/c25a627d-6a86-4816-a676-534966406180_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/innov-0/c25a627d-6a86-4816-a676-534966406180_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 04:49:02.146148+00	2026-05-12 04:49:02.14615+00	2026-05-12 04:49:02.146151+00
5b3f1440-1ab0-49c5-a3a5-65b6848676ea	samarthgangji2405@gmail.com	2025-2026	\N	qual-	\N	\N	1	qual-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/qual-0/f51c5232-81ee-40e6-93c0-f60c59746363_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/qual-0/f51c5232-81ee-40e6-93c0-f60c59746363_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 04:49:02.146158+00	2026-05-12 04:49:02.14616+00	2026-05-12 04:49:02.146161+00
6259115e-33f8-4756-98d0-0923517adc9e	samarthgangji2405@gmail.com	2025-2026	\N	dept-	\N	\N	1	dept-0	api.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/dept-0/ab751f45-028f-4802-b7d0-999d12cf8bfd_api.pdf	faculty-appraisal/dept-0/ab751f45-028f-4802-b7d0-999d12cf8bfd_api.pdf	2026-05-12 04:49:02.146168+00	2026-05-12 04:49:02.14617+00	2026-05-12 04:49:02.146173+00
21aeb414-4035-49e2-afa9-af83ce8a9d23	samarthgangji2405@gmail.com	2025-2026	\N	uni-	\N	\N	1	uni-0	api.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-0/017d43b7-0d65-47dc-a9c7-8ee751dfa3a5_api.pdf	faculty-appraisal/uni-0/017d43b7-0d65-47dc-a9c7-8ee751dfa3a5_api.pdf	2026-05-12 04:49:02.14618+00	2026-05-12 04:49:02.146182+00	2026-05-12 04:49:02.146184+00
c6f1664f-ab08-44db-b33f-5950a3e10bc1	samarthgangji2405@gmail.com	2025-2026	\N	soc-	\N	\N	1	soc-0	api.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/soc-0/bff7d444-2ace-408d-ad7a-c3339abf5499_api.pdf	faculty-appraisal/soc-0/bff7d444-2ace-408d-ad7a-c3339abf5499_api.pdf	2026-05-12 04:49:02.14619+00	2026-05-12 04:49:02.146192+00	2026-05-12 04:49:02.146193+00
a3ab4657-88cb-48b0-b79c-dae53b556a60	samarthgangji2405@gmail.com	2025-2026	\N	ind-	\N	\N	1	ind-0	api.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-0/fc67d35c-9e45-41ee-8ec1-fba4bb60059d_api.pdf	faculty-appraisal/ind-0/fc67d35c-9e45-41ee-8ec1-fba4bb60059d_api.pdf	2026-05-12 04:49:02.146199+00	2026-05-12 04:49:02.146201+00	2026-05-12 04:49:02.146202+00
fd6c05f2-919d-4dcb-ba45-bf2ce29b650a	samarthgangji2405@gmail.com	2025-2026	\N	jour-	\N	\N	1	jour-0	final backend endpoints.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/jour-0/69977a45-59e4-4a15-bc3e-4bd5cd64472a_final_backend_endpoints.pdf	faculty-appraisal/jour-0/69977a45-59e4-4a15-bc3e-4bd5cd64472a_final_backend_endpoints.pdf	2026-05-12 04:49:02.146209+00	2026-05-12 04:49:02.14621+00	2026-05-12 04:49:02.146212+00
559934cc-7fd5-47b5-ad89-9ba25bc7c4ff	samarthgangji2405@gmail.com	2025-2026	\N	book-	\N	\N	1	book-0	final backend endpoints.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-0/57967449-ef00-4b46-80da-a1b82f1dc1b0_final_backend_endpoints.pdf	faculty-appraisal/book-0/57967449-ef00-4b46-80da-a1b82f1dc1b0_final_backend_endpoints.pdf	2026-05-12 04:49:02.146218+00	2026-05-12 04:49:02.14622+00	2026-05-12 04:49:02.146221+00
fed21fc4-c706-48da-b5d2-5baba189d4ae	samarthgangji2405@gmail.com	2025-2026	\N	ict-	\N	\N	1	ict-0	final backend endpoints.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ict-0/ccd8760d-fa73-406f-83f6-63dd498de8cf_final_backend_endpoints.pdf	faculty-appraisal/ict-0/ccd8760d-fa73-406f-83f6-63dd498de8cf_final_backend_endpoints.pdf	2026-05-12 04:49:02.146228+00	2026-05-12 04:49:02.146229+00	2026-05-12 04:49:02.14623+00
0c301c6e-8d30-46f2-b468-bd367c1abbe3	samarthgangji2405@gmail.com	2025-2026	\N	project2-	\N	\N	1	project2-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/project2-0/29da30a0-57fc-4c65-8325-e0627853a6ed_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/project2-0/29da30a0-57fc-4c65-8325-e0627853a6ed_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 04:49:02.146236+00	2026-05-12 04:49:02.146238+00	2026-05-12 04:49:02.146239+00
89edeba7-6c22-4ab7-a3b2-a15cbccb243c	samarthgangji2405@gmail.com	2025-2026	\N	externalProject-	\N	\N	1	externalProject-0	final backend endpoints.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/externalProject-0/8bc7b371-5cef-4d4b-aee7-8e79e583c17e_final_backend_endpoints.pdf	faculty-appraisal/externalProject-0/8bc7b371-5cef-4d4b-aee7-8e79e583c17e_final_backend_endpoints.pdf	2026-05-12 04:49:02.146245+00	2026-05-12 04:49:02.146247+00	2026-05-12 04:49:02.146248+00
babcda18-b055-471f-abfc-7996d1047334	samarthgangji2405@gmail.com	2025-2026	\N	pat-	\N	\N	1	pat-0	final backend endpoints.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/pat-0/af0be3df-e533-4fa4-aba5-bdefec81c2eb_final_backend_endpoints.pdf	faculty-appraisal/pat-0/af0be3df-e533-4fa4-aba5-bdefec81c2eb_final_backend_endpoints.pdf	2026-05-12 04:49:02.146254+00	2026-05-12 04:49:02.146256+00	2026-05-12 04:49:02.146257+00
b57bae03-ac7d-49e5-b639-fe1a489253c2	samarthgangji2405@gmail.com	2025-2026	\N	awd-	\N	\N	1	awd-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/awd-0/e86dd092-91a4-40cd-8465-c7215cb6616d_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/awd-0/e86dd092-91a4-40cd-8465-c7215cb6616d_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 04:49:02.146263+00	2026-05-12 04:49:02.146265+00	2026-05-12 04:49:02.146266+00
98315288-5ef2-4aeb-b639-8d664ade796f	samarthgangji2405@gmail.com	2025-2026	\N	conf-	\N	\N	1	conf-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/conf-0/74b31daa-0379-42e1-b563-e9b3a4ba10fa_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/conf-0/74b31daa-0379-42e1-b563-e9b3a4ba10fa_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 04:49:02.146272+00	2026-05-12 04:49:02.146274+00	2026-05-12 04:49:02.146275+00
4ace8f40-4ec3-4245-9671-5822ddf71bb9	samarthgangji2405@gmail.com	2025-2026	\N	prop-	\N	\N	1	prop-0	final backend endpoints.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prop-0/d76d72d8-0ba4-4f0e-b8eb-f16f4905da23_final_backend_endpoints.pdf	faculty-appraisal/prop-0/d76d72d8-0ba4-4f0e-b8eb-f16f4905da23_final_backend_endpoints.pdf	2026-05-12 04:49:02.146282+00	2026-05-12 04:49:02.146283+00	2026-05-12 04:49:02.146286+00
120d8496-90a3-41a0-8317-b10c207ed39e	samarthgangji2405@gmail.com	2025-2026	\N	prod-	\N	\N	1	prod-0	api.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prod-0/529d9951-faa6-436a-9177-2852b42d16c5_api.pdf	faculty-appraisal/prod-0/529d9951-faa6-436a-9177-2852b42d16c5_api.pdf	2026-05-12 04:49:02.146294+00	2026-05-12 04:49:02.146295+00	2026-05-12 04:49:02.146296+00
ff7dd9b8-2c6f-4f0f-8442-8f4a838eee3c	samarthgangji2405@gmail.com	2025-2026	\N	fdp-	\N	\N	1	fdp-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/fdp-0/139c93c8-9244-4f3e-917c-48e75f92f4c3_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/fdp-0/139c93c8-9244-4f3e-917c-48e75f92f4c3_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 04:49:02.146302+00	2026-05-12 04:49:02.146304+00	2026-05-12 04:49:02.146305+00
8446d5b1-d457-4db3-956d-1732302a2065	samarthgangji2405@gmail.com	2025-2026	\N	train-	\N	\N	1	train-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/train-0/a4fd2cf0-e2ef-405a-9b75-e232fc632057_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/train-0/a4fd2cf0-e2ef-405a-9b75-e232fc632057_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 04:49:02.146311+00	2026-05-12 04:49:02.146313+00	2026-05-12 04:49:02.146314+00
659b7f77-7c76-40a2-9867-62ab933a2237	providence2405@gmail.com	2025-2026	\N	lec-	\N	\N	1	lec-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-0/ad229228-9004-4d57-b6f7-30c96002c8bd_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/lec-0/ad229228-9004-4d57-b6f7-30c96002c8bd_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 05:28:21.279774+00	2026-05-12 05:28:21.27978+00	2026-05-12 05:28:21.279783+00
dd4969a3-03ee-4168-8dd2-6451cb636fd4	providence2405@gmail.com	2025-2026	\N	qual-	\N	\N	1	qual-0	final backend endpoints.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/qual-0/1dcfd364-e5c2-4e43-9739-a961367b5074_final_backend_endpoints.pdf	faculty-appraisal/qual-0/1dcfd364-e5c2-4e43-9739-a961367b5074_final_backend_endpoints.pdf	2026-05-12 05:28:21.279795+00	2026-05-12 05:28:21.279797+00	2026-05-12 05:28:21.279798+00
825f06eb-3750-4319-9640-723c9af2b41f	providence2405@gmail.com	2025-2026	\N	innov-	\N	\N	1	innov-0	final backend endpoints.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-0/71198323-48a0-4d2e-a152-b37bb234a765_final_backend_endpoints.pdf	faculty-appraisal/innov-0/71198323-48a0-4d2e-a152-b37bb234a765_final_backend_endpoints.pdf	2026-05-12 05:28:21.279806+00	2026-05-12 05:28:21.279807+00	2026-05-12 05:28:21.279809+00
9e58c179-2466-496f-806e-2082d768c80a	providence2405@gmail.com	2025-2026	\N	dept-	\N	\N	1	dept-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/dept-0/9febe6a1-16da-4a99-9463-c488304ed700_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/dept-0/9febe6a1-16da-4a99-9463-c488304ed700_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 05:28:21.279815+00	2026-05-12 05:28:21.279817+00	2026-05-12 05:28:21.279818+00
6f137f2b-c1de-48c9-a4c4-33c332ca1752	providence2405@gmail.com	2025-2026	\N	uni-	\N	\N	1	uni-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-0/6e47c3c5-c84b-4c0c-b16c-854c81fb50fd_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/uni-0/6e47c3c5-c84b-4c0c-b16c-854c81fb50fd_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 05:28:21.279824+00	2026-05-12 05:28:21.279826+00	2026-05-12 05:28:21.279827+00
af4a2918-98f4-4e06-bca2-6a91621f832d	providence2405@gmail.com	2025-2026	\N	ind-	\N	\N	1	ind-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-0/0ac4060c-aa59-48a4-8a15-014e8105aeb9_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/ind-0/0ac4060c-aa59-48a4-8a15-014e8105aeb9_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 05:28:21.279834+00	2026-05-12 05:28:21.279835+00	2026-05-12 05:28:21.279837+00
94e0cb66-de0e-4a67-8831-4c619356acd8	providence2405@gmail.com	2025-2026	\N	jour-	\N	\N	1	jour-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/jour-0/4e3111ff-05dc-4360-b91a-46d7f98bcf8a_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/jour-0/4e3111ff-05dc-4360-b91a-46d7f98bcf8a_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 05:28:21.279843+00	2026-05-12 05:28:21.279845+00	2026-05-12 05:28:21.279857+00
dad31246-54c3-45a8-813c-dcf40fadd518	providence2405@gmail.com	2025-2026	\N	book-	\N	\N	1	book-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-0/dd832b41-448d-43da-b219-4ea878a7407c_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/book-0/dd832b41-448d-43da-b219-4ea878a7407c_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 05:28:21.279869+00	2026-05-12 05:28:21.27987+00	2026-05-12 05:28:21.279872+00
c3852848-b0b3-4aaf-a0cd-aaf464d5e68c	providence2405@gmail.com	2025-2026	\N	ict-	\N	\N	1	ict-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ict-0/45d1c3d9-7cfa-4a81-890b-728936fc3c8c_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/ict-0/45d1c3d9-7cfa-4a81-890b-728936fc3c8c_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 05:28:21.279879+00	2026-05-12 05:28:21.279881+00	2026-05-12 05:28:21.279882+00
ed71213b-291b-4eab-9700-e436524d9bd5	providence2405@gmail.com	2025-2026	\N	pat-	\N	\N	1	pat-0	final backend endpoints.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/pat-0/9982a3f7-bd1b-4ab8-860a-8b818f415843_final_backend_endpoints.pdf	faculty-appraisal/pat-0/9982a3f7-bd1b-4ab8-860a-8b818f415843_final_backend_endpoints.pdf	2026-05-12 05:28:21.279888+00	2026-05-12 05:28:21.27989+00	2026-05-12 05:28:21.279891+00
5719ef40-2ed7-4179-bd55-e3a8fa20e5a6	providence2405@gmail.com	2025-2026	\N	awd-	\N	\N	1	awd-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/awd-0/9954f87d-56ca-489c-83f7-e386a79f5d1c_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/awd-0/9954f87d-56ca-489c-83f7-e386a79f5d1c_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 05:28:21.279897+00	2026-05-12 05:28:21.279899+00	2026-05-12 05:28:21.2799+00
ac6013f9-11a2-4405-9fba-8e420de82f72	providence2405@gmail.com	2025-2026	\N	conf-	\N	\N	1	conf-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/conf-0/e67493bc-4b60-4877-90aa-64ba2d8374ea_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/conf-0/e67493bc-4b60-4877-90aa-64ba2d8374ea_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 05:28:21.279906+00	2026-05-12 05:28:21.279908+00	2026-05-12 05:28:21.27991+00
e4d2de6e-0c0f-44fc-95f1-b1a8f1c8fec7	providence2405@gmail.com	2025-2026	\N	prop-	\N	\N	1	prop-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prop-0/3849fcb8-22a6-4fe2-8917-9c8c85eed9e4_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/prop-0/3849fcb8-22a6-4fe2-8917-9c8c85eed9e4_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 05:28:21.279916+00	2026-05-12 05:28:21.279917+00	2026-05-12 05:28:21.279919+00
9ec6779d-6645-49c8-8925-5e4774ef4eff	providence2405@gmail.com	2025-2026	\N	prod-	\N	\N	1	prod-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prod-0/bcab84be-de05-498c-8afb-c0ec1c62cc68_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/prod-0/bcab84be-de05-498c-8afb-c0ec1c62cc68_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 05:28:21.279925+00	2026-05-12 05:28:21.279926+00	2026-05-12 05:28:21.279927+00
fdd23627-121a-459e-b98f-1f5c0258a28e	providence2405@gmail.com	2025-2026	\N	fdp-	\N	\N	1	fdp-0	final backend endpoints.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/fdp-0/e03c029c-1f61-4581-8cda-65f7183dc5ac_final_backend_endpoints.pdf	faculty-appraisal/fdp-0/e03c029c-1f61-4581-8cda-65f7183dc5ac_final_backend_endpoints.pdf	2026-05-12 05:28:21.279934+00	2026-05-12 05:28:21.279935+00	2026-05-12 05:28:21.279937+00
17a9653a-9582-467f-b2a3-b1e88e4d3a4d	providence2405@gmail.com	2025-2026	\N	train-	\N	\N	1	train-0	15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	application/pdf	https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/train-0/349daa54-1893-4d99-93dc-5290090e1fad_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	faculty-appraisal/train-0/349daa54-1893-4d99-93dc-5290090e1fad_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf	2026-05-12 05:28:21.279942+00	2026-05-12 05:28:21.279944+00	2026-05-12 05:28:21.279945+00
\.


--
-- Data for Name: appraisal_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appraisal_reviews (id, faculty_email, academic_year, reviewer_email, reviewer_role, part_a_score, part_b_score, total_score, remarks, section_scores, status, reviewed_at, created_at, updated_at) FROM stdin;
ebf06007-2169-4998-a840-731711de2d36	sunil.dambhare@dypiu.ac.in	2025-2026	ganesh.jadhav@dypiu.ac.in	hod	151	145	296	Good	{"acr": [{"hod": "4", "label": "Self-motivation and Proactiveness", "score": "", "director": ""}, {"hod": "5", "label": "Punctuality", "score": "", "director": ""}, {"hod": "4", "label": "Target based work", "score": "", "director": ""}, {"hod": "5", "label": "Effectiveness", "score": "", "director": ""}, {"hod": "4", "label": "Obedience", "score": "", "director": ""}], "ict": [{"hod": "20", "desc": "www.dypiu.ac.in", "quad": "IV", "type": "e content", "score": "20", "title": "Website", "director": "", "quadrant": "IV", "description": "www.dypiu.ac.in"}], "fdps": [{"hod": "5", "org": "DYPIU", "score": "5", "program": "FDP 1", "director": "", "duration": "1 week", "organization": "DYPIU"}, {"hod": "5", "org": "DYPIU", "score": "5", "program": "FDP 2", "director": "", "duration": "1 week", "organization": "DYPIU"}], "books": [{"hod": "10", "pub": "International", "book": "THM", "issn": "1234 1232", "first": "No", "score": "10", "title": "Book Chapter 1", "coauth": "No", "coauthor": "No", "director": "", "publisher": "International", "first_author": "No"}, {"hod": "10", "pub": "International", "book": "ABC", "issn": "1122 3344", "first": "No", "score": "10", "title": "Book Chapter 2", "coauth": "No", "coauthor": "No", "director": "", "publisher": "International", "first_author": "No"}], "confs": [{"hod": "", "org": "", "type": "", "level": "", "score": "", "title": "", "director": "", "organization": ""}], "quals": [{"hod": "", "label": "Higher Qualification achieved (5 Marks)", "score": "", "director": ""}], "awards": [{"hod": "", "date": "", "level": "", "score": "", "title": "", "agency": "", "director": "", "award_date": ""}], "patents": [{"hod": "30", "date": "01/04/2026", "type": "National", "score": "30", "title": "Solar Lamp", "fileNo": "1234", "status": "Granted", "file_no": "1234", "director": "", "patent_date": "01/04/2026", "patent_status": "Granted"}, {"hod": "", "date": "", "type": "", "score": "", "title": "", "fileNo": "", "status": "", "file_no": "", "director": "", "patent_date": "", "patent_status": ""}], "society": [{"hod": "5", "label": "Induction Program", "score": "5", "details": "Coordinator", "activity": "Induction Program", "director": "", "participated": "Yes"}, {"hod": "", "label": "Unnat Bharat Abhiyan", "score": "", "details": "", "activity": "Unnat Bharat Abhiyan", "director": "", "participated": ""}, {"hod": "", "label": "Yoga Classes", "score": "", "details": "", "activity": "Yoga Classes", "director": "", "participated": ""}, {"hod": "", "label": "Blood Donation", "score": "", "details": "", "activity": "Blood Donation", "director": "", "participated": ""}, {"hod": "", "label": "Techno Social activities", "score": "", "details": "", "activity": "Techno Social activities", "director": "", "participated": ""}, {"hod": "", "label": "NSS", "score": "", "details": "", "activity": "NSS", "director": "", "participated": ""}, {"hod": "", "label": "Social visits", "score": "", "details": "", "activity": "Social visits", "director": "", "participated": ""}, {"hod": "", "label": "Project of Social Impact", "score": "", "details": "", "activity": "Project of Social Impact", "director": "", "participated": ""}, {"hod": "", "label": "Any other activity", "score": "", "details": "", "activity": "Any other activity", "director": "", "participated": ""}], "uniActs": [{"hod": "30", "score": "30", "nature": "Full Time", "activity": "Director IQAC", "director": ""}, {"hod": "25", "score": "25", "nature": "Year Long", "activity": "SAE Coordinator", "director": ""}, {"hod": "", "score": "", "nature": "", "activity": "", "director": ""}], "deptActs": [{"hod": "20", "score": "20", "nature": "Year Long", "activity": "SAE BAJA", "director": ""}], "feedback": [{"fb1": "78", "fb2": "82", "hod": "08", "code": "Computational Techniques", "score": "8.0", "director": "", "feedback_1": "78", "feedback_2": "82", "course_code": "Computational Techniques"}, {"fb1": "82", "fb2": "85", "hod": "9", "code": "Fluid Mechanics", "score": "8.3", "director": "", "feedback_1": "82", "feedback_2": "85", "course_code": "Fluid Mechanics"}, {"fb1": "", "fb2": "", "hod": "", "code": "", "score": "0.0", "director": "", "feedback_1": "", "feedback_2": "", "course_code": ""}], "industry": [{"hod": "5", "name": "Atlas COPCO", "score": "5", "details": "Curriculum Development", "director": ""}, {"hod": "5", "name": "Dassault Systems", "score": "5", "details": "CoE", "director": ""}], "journals": [{"hod": "10", "issn": "2233 3344", "index": "Scopus", "score": "10", "title": "Effect of Grain Size", "journal": "Journal of", "director": "", "indexing": "Scopus"}, {"hod": "10", "issn": "1123 3245", "index": "Scopus", "score": "10", "title": "ResearchPaper", "journal": "Journal of", "director": "", "indexing": "Scopus"}], "lectures": [{"hod": "50", "sem": "TY B Tech V", "code": "Computational Techniques", "score": "50", "planned": "36", "director": "", "semester": "TY B Tech V", "conducted": "38", "course_code": "Computational Techniques", "planned_classes": "36", "conducted_classes": "38"}, {"hod": "48", "sem": "SY B Tech III", "code": "Fluid Machinery", "score": "50", "planned": "36", "director": "", "semester": "SY B Tech III", "conducted": "37", "course_code": "Fluid Machinery", "planned_classes": "36", "conducted_classes": "37"}], "products": [{"hod": "10", "score": "10", "usage": "Faculty", "details": "Website", "director": ""}], "projects": [{"hod": "", "label": "", "score": "", "director": ""}, {"hod": "", "label": "", "score": "", "director": ""}, {"hod": "", "label": "", "score": "", "director": ""}, {"hod": "", "label": "", "score": "", "director": ""}], "research": [{"hod": "", "name": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}, {"hod": "", "name": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}], "training": [{"hod": "", "score": "", "nature": "", "company": "", "director": "", "duration": ""}], "projects2": [{"hod": "10", "date": "01/03/2026", "role": "CO-PI", "score": "10", "title": "Spray Materia", "agency": "DYPIU", "amount": "1000000", "status": "Ongoing", "sanction_date": "01/03/2026", "project_status": "Ongoing"}, {"hod": "", "date": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "status": "", "sanction_date": "", "project_status": ""}], "proposals": [{"hod": "10", "score": "10", "title": "Spary", "agency": "ANRF", "amount": "5900000", "director": "", "duration": "2 Years"}, {"hod": "", "score": "", "title": "", "agency": "", "amount": "", "director": "", "duration": ""}], "courseFile": [{"hod": "2", "score": "2", "title": "SY B Tech", "course": "Fluid Mechanics", "details": "As per IQAC Format", "director": ""}, {"hod": "2", "score": "2", "title": "SY B Tech", "course": "Fluid Mechanics", "details": "As per IQAC Format", "director": ""}], "externalProjects": [{"hod": "10", "date": "15/02/2026", "role": "Co-PI", "score": "10", "title": "Consultancy", "agency": "GTech", "amount": "205000", "status": "Completed", "sanction_date": "15/02/2026", "project_status": "Completed"}, {"hod": "5", "date": "10/01/2026", "role": "CO-PI", "score": "5", "title": "Consultancy", "agency": "Fabritek", "amount": "100000", "status": "Completed", "sanction_date": "10/01/2026", "project_status": "Completed"}], "innovativeTeaching": {"hod": "8"}}	Reviewed	2026-05-11 12:01:26.818866+00	2026-05-11 12:01:26.818871+00	2026-05-11 12:01:26.818873+00
9f85bec2-27a2-422a-9b98-e4988f65208f	ram.kunwer@dypiu.ac.in	2025-2026	swapnil.bhurat@dypiu.ac.in	director	102	46	148	very good	{"acr": [{"hod": "", "label": "Self-motivation and Proactiveness", "score": "", "director": "5"}, {"hod": "", "label": "Punctuality", "score": "", "director": "5"}, {"hod": "", "label": "Target based work", "score": "", "director": "5"}, {"hod": "", "label": "Effectiveness", "score": "", "director": "5"}, {"hod": "", "label": "Obedience", "score": "", "director": "5"}], "ict": [{"hod": "", "desc": "", "quad": "", "type": "", "score": "", "title": "", "director": "", "quadrant": "", "description": ""}], "fdps": [{"hod": "", "org": "DYPIU", "score": "5", "program": "FDP1", "director": "5", "duration": "5", "organization": "DYPIU"}, {"hod": "", "org": "DYPIU", "score": "5", "program": "FDP2", "director": "5", "duration": "5", "organization": "DYPIU"}], "books": [{"hod": "", "pub": "Research", "book": "Springer", "issn": "9832e784", "first": "Yes", "score": "20", "title": "Book Chapter 1", "coauth": "1", "coauthor": "1", "director": "10", "publisher": "Research", "first_author": "Yes"}, {"hod": "", "pub": "", "book": "", "issn": "", "first": "", "score": "", "title": "", "coauth": "", "coauthor": "", "director": "", "publisher": "", "first_author": ""}], "confs": [{"hod": "", "org": "SYNOPSIS", "type": "Symposium", "level": "NA", "score": "30", "title": "CFD", "director": "0", "organization": "SYNOPSIS"}], "quals": [{"hod": "", "label": "Higher Qualification achieved (5 Marks)", "score": "", "director": "0"}], "awards": [{"hod": "", "date": "", "level": "", "score": "", "title": "", "agency": "", "director": "0", "award_date": ""}], "patents": [{"hod": "", "date": "", "type": "", "score": "", "title": "", "fileNo": "", "status": "", "file_no": "", "director": "0", "patent_date": "", "patent_status": ""}], "society": [{"hod": "", "label": "", "score": "0", "details": "NA", "activity": "", "director": "0", "participated": "No"}], "uniActs": [{"hod": "", "score": "30", "nature": "University", "activity": "NAAC", "director": "30"}], "deptActs": [{"hod": "", "score": "20", "nature": "M. Tech Smart Manufacturing", "activity": "Program Booklet", "director": "20"}], "feedback": [{"fb1": "80", "fb2": "80", "hod": "", "code": "Vehicle Dynamics", "score": "8.0", "director": "8", "feedback_1": "80", "feedback_2": "80", "course_code": "Vehicle Dynamics"}, {"fb1": "80", "fb2": "80", "hod": "", "code": "Advanced Manufacturing", "score": "8.0", "director": "8", "feedback_1": "80", "feedback_2": "80", "course_code": "Advanced Manufacturing"}, {"fb1": "80", "fb2": "80", "hod": "", "code": "FEM", "score": "8.0", "director": "8", "feedback_1": "80", "feedback_2": "80", "course_code": "FEM"}], "industry": [{"hod": "", "name": "SYNOPSIS", "score": "5", "details": "LAB", "director": "4"}], "journals": [{"hod": "", "issn": "01010", "index": "01", "score": "10", "title": "Research article", "journal": "Scientific Report", "director": "8", "indexing": "01"}, {"hod": "", "issn": "0329309", "index": "92", "score": "10", "title": "Research Article", "journal": "Scientific Report", "director": "8", "indexing": "92"}], "lectures": [{"hod": "", "sem": "VI", "code": "Advanced Manufacturing Processes", "score": "50", "planned": "30", "director": "45", "semester": "VI", "conducted": "30", "course_code": "Advanced Manufacturing Processes", "planned_classes": "30", "conducted_classes": "30"}, {"hod": "", "sem": "II", "code": "Vehicle Dynamics", "score": "50", "planned": "30", "director": "45", "semester": "II", "conducted": "30", "course_code": "Vehicle Dynamics", "planned_classes": "30", "conducted_classes": "30"}], "products": [{"hod": "", "score": "", "usage": "", "details": "", "director": "00"}], "projects": [{"hod": "", "label": "Project guided (3/batch)", "score": "3", "director": "3"}, {"hod": "", "label": "Industrial collaboration / Sponsorship (Max 5)", "score": "2", "director": "2"}, {"hod": "", "label": "Award received (Max 5 marks)", "score": "3", "director": "0"}, {"hod": "", "label": "Project outcome: events/publications (Max 5)", "score": "2", "director": "2"}], "research": [{"hod": "", "name": "Nikhil Kumar", "score": "20", "degree": "PhD", "thesis": "Thermal Energy Storage", "director": "00", "student_name": "Nikhil Kumar"}, {"hod": "", "name": "Praveen Kumar", "score": "20", "degree": "PhD", "thesis": "WLB", "director": "00", "student_name": "Praveen Kumar"}], "training": [{"hod": "", "score": "", "nature": "", "company": "", "director": "0", "duration": ""}], "projects2": [{"hod": "", "date": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "status": "", "director": "", "sanction_date": "", "project_status": ""}], "proposals": [{"hod": "", "score": "10", "title": "Research Proposal", "agency": "Maharashtra", "amount": "2000000", "director": "10", "duration": "2"}], "courseFile": [{"hod": "", "score": "2", "title": "Advanced Manufacturing Processes", "course": "Course File", "details": "All checklist attached", "director": "2"}, {"hod": "", "score": "2", "title": "Vehicle Dynamics", "course": "Course File", "details": "All Checklist attached", "director": "2"}, {"hod": "", "score": "2", "title": "FEA", "course": "Course File`", "details": "All Checklist attached", "director": "2"}], "externalProjects": [{"hod": "", "date": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "status": "", "director": "0", "sanction_date": "", "project_status": ""}], "innovativeTeaching": {"director": "4"}}	Reviewed	2026-05-11 12:31:20.319571+00	2026-05-11 12:31:20.319576+00	2026-05-11 12:31:20.319578+00
022e70c6-e4ce-44d5-9066-837466e3fd01	sunil.dambhare@dypiu.ac.in	2025-2026	anupama.patil@dypiu.ac.in	director	105.5	145	250.5	GOOOD	{"acr": [{"hod": "4", "label": "Self-motivation and Proactiveness", "score": "", "director": "5"}, {"hod": "5", "label": "Punctuality", "score": "", "director": "5"}, {"hod": "4", "label": "Target based work", "score": "", "director": "5"}, {"hod": "5", "label": "Effectiveness", "score": "", "director": "5"}, {"hod": "4", "label": "Obedience", "score": "", "director": "5"}], "ict": [{"hod": "20", "desc": "www.dypiu.ac.in", "quad": "IV", "type": "e content", "score": "20", "title": "Website", "director": "20", "quadrant": "IV", "description": "www.dypiu.ac.in"}], "fdps": [{"hod": "5", "org": "DYPIU", "score": "5", "program": "FDP 1", "director": "5", "duration": "1 week", "organization": "DYPIU"}, {"hod": "5", "org": "DYPIU", "score": "5", "program": "FDP 2", "director": "5", "duration": "1 week", "organization": "DYPIU"}], "books": [{"hod": "10", "pub": "International", "book": "THM", "issn": "1234 1232", "first": "No", "score": "10", "title": "Book Chapter 1", "coauth": "No", "coauthor": "No", "director": "10", "publisher": "International", "first_author": "No"}, {"hod": "10", "pub": "International", "book": "ABC", "issn": "1122 3344", "first": "No", "score": "10", "title": "Book Chapter 2", "coauth": "No", "coauthor": "No", "director": "10", "publisher": "International", "first_author": "No"}], "confs": [{"hod": "", "org": "", "type": "", "level": "", "score": "", "title": "", "director": "", "organization": ""}], "quals": [{"hod": "", "label": "Higher Qualification achieved (5 Marks)", "score": "", "director": ""}], "awards": [{"hod": "", "date": "", "level": "", "score": "", "title": "", "agency": "", "director": "", "award_date": ""}], "patents": [{"hod": "30", "date": "01/04/2026", "type": "National", "score": "30", "title": "Solar Lamp", "fileNo": "1234", "status": "Granted", "file_no": "1234", "director": "30", "patent_date": "01/04/2026", "patent_status": "Granted"}, {"hod": "", "date": "", "type": "", "score": "", "title": "", "fileNo": "", "status": "", "file_no": "", "director": "", "patent_date": "", "patent_status": ""}], "society": [{"hod": "5", "label": "Induction Program", "score": "5", "details": "Coordinator", "activity": "Induction Program", "director": "5", "participated": "Yes"}, {"hod": "", "label": "Unnat Bharat Abhiyan", "score": "", "details": "", "activity": "Unnat Bharat Abhiyan", "director": "0", "participated": ""}, {"hod": "", "label": "Yoga Classes", "score": "", "details": "", "activity": "Yoga Classes", "director": "", "participated": ""}, {"hod": "", "label": "Blood Donation", "score": "", "details": "", "activity": "Blood Donation", "director": "", "participated": ""}, {"hod": "", "label": "Techno Social activities", "score": "", "details": "", "activity": "Techno Social activities", "director": "", "participated": ""}, {"hod": "", "label": "NSS", "score": "", "details": "", "activity": "NSS", "director": "", "participated": ""}, {"hod": "", "label": "Social visits", "score": "", "details": "", "activity": "Social visits", "director": "", "participated": ""}, {"hod": "", "label": "Project of Social Impact", "score": "", "details": "", "activity": "Project of Social Impact", "director": "", "participated": ""}, {"hod": "", "label": "Any other activity", "score": "", "details": "", "activity": "Any other activity", "director": "", "participated": ""}], "uniActs": [{"hod": "30", "score": "30", "nature": "Full Time", "activity": "Director IQAC", "director": "30"}, {"hod": "25", "score": "25", "nature": "Year Long", "activity": "SAE Coordinator", "director": "25"}, {"hod": "", "score": "", "nature": "", "activity": "", "director": ""}], "deptActs": [{"hod": "20", "score": "20", "nature": "Year Long", "activity": "SAE BAJA", "director": "20"}], "feedback": [{"fb1": "78", "fb2": "82", "hod": "08", "code": "Computational Techniques", "score": "8.0", "director": "8", "feedback_1": "78", "feedback_2": "82", "course_code": "Computational Techniques"}, {"fb1": "82", "fb2": "85", "hod": "9", "code": "Fluid Mechanics", "score": "8.3", "director": "9", "feedback_1": "82", "feedback_2": "85", "course_code": "Fluid Mechanics"}, {"fb1": "", "fb2": "", "hod": "", "code": "", "score": "0.0", "director": "", "feedback_1": "", "feedback_2": "", "course_code": ""}], "industry": [{"hod": "5", "name": "Atlas COPCO", "score": "5", "details": "Curriculum Development", "director": "5"}, {"hod": "5", "name": "Dassault Systems", "score": "5", "details": "CoE", "director": "5"}], "journals": [{"hod": "10", "issn": "2233 3344", "index": "Scopus", "score": "10", "title": "Effect of Grain Size", "journal": "Journal of", "director": "10", "indexing": "Scopus"}, {"hod": "10", "issn": "1123 3245", "index": "Scopus", "score": "10", "title": "ResearchPaper", "journal": "Journal of", "director": "10", "indexing": "Scopus"}], "lectures": [{"hod": "50", "sem": "TY B Tech V", "code": "Computational Techniques", "score": "50", "planned": "36", "director": "50", "semester": "TY B Tech V", "conducted": "38", "course_code": "Computational Techniques", "planned_classes": "36", "conducted_classes": "38"}, {"hod": "48", "sem": "SY B Tech III", "code": "Fluid Machinery", "score": "50", "planned": "36", "director": "50", "semester": "SY B Tech III", "conducted": "37", "course_code": "Fluid Machinery", "planned_classes": "36", "conducted_classes": "37"}], "products": [{"hod": "10", "score": "10", "usage": "Faculty", "details": "Website", "director": "10"}], "projects": [{"hod": "", "label": "", "score": "", "director": ""}, {"hod": "", "label": "", "score": "", "director": ""}, {"hod": "", "label": "", "score": "", "director": ""}, {"hod": "", "label": "", "score": "", "director": ""}], "research": [{"hod": "", "name": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}, {"hod": "", "name": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}], "training": [{"hod": "", "score": "", "nature": "", "company": "", "director": "", "duration": ""}], "projects2": [{"hod": "10", "date": "01/03/2026", "role": "CO-PI", "score": "10", "title": "Spray Materia", "agency": "DYPIU", "amount": "1000000", "status": "Ongoing", "director": "10", "sanction_date": "01/03/2026", "project_status": "Ongoing"}, {"hod": "", "date": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "status": "", "director": "", "sanction_date": "", "project_status": ""}], "proposals": [{"hod": "10", "score": "10", "title": "Spary", "agency": "ANRF", "amount": "5900000", "director": "10", "duration": "2 Years"}, {"hod": "", "score": "", "title": "", "agency": "", "amount": "", "director": "", "duration": ""}], "courseFile": [{"hod": "2", "score": "2", "title": "SY B Tech", "course": "Fluid Mechanics", "details": "As per IQAC Format", "director": "2"}, {"hod": "2", "score": "2", "title": "SY B Tech", "course": "Fluid Mechanics", "details": "As per IQAC Format", "director": "2"}], "externalProjects": [{"hod": "10", "date": "15/02/2026", "role": "Co-PI", "score": "10", "title": "Consultancy", "agency": "GTech", "amount": "205000", "status": "Completed", "director": "10", "sanction_date": "15/02/2026", "project_status": "Completed"}, {"hod": "5", "date": "10/01/2026", "role": "CO-PI", "score": "5", "title": "Consultancy", "agency": "Fabritek", "amount": "100000", "status": "Completed", "director": "5", "sanction_date": "10/01/2026", "project_status": "Completed"}], "innovativeTeaching": {"director": "8.5"}}	Reviewed	2026-05-11 12:04:55.849314+00	2026-05-11 12:04:55.84932+00	2026-05-12 02:51:07.228584+00
0d5b2ba1-8613-407d-a188-3f913935b732	sunil.dambhare@dypiu.ac.in	2025-2026	deanfaculties_engineering@dypiu.ac.in	dean	157	142	299		{"acr": [{"hod": "4", "dean": "5", "label": "Self-motivation and Proactiveness", "score": "", "director": "5"}, {"hod": "5", "dean": "5", "label": "Punctuality", "score": "", "director": "5"}, {"hod": "4", "dean": "5", "label": "Target based work", "score": "", "director": "5"}, {"hod": "5", "dean": "5", "label": "Effectiveness", "score": "", "director": "5"}, {"hod": "4", "dean": "5", "label": "Obedience", "score": "", "director": "5"}], "ict": [{"hod": "20", "dean": "20", "desc": "www.dypiu.ac.in", "quad": "IV", "type": "e content", "score": "20", "title": "Website", "director": "20", "quadrant": "IV", "description": "www.dypiu.ac.in"}], "fdps": [{"hod": "5", "org": "DYPIU", "dean": "5", "score": "5", "program": "FDP 1", "director": "5", "duration": "1 week", "organization": "DYPIU"}, {"hod": "5", "org": "DYPIU", "dean": "5", "score": "5", "program": "FDP 2", "director": "5", "duration": "1 week", "organization": "DYPIU"}], "books": [{"hod": "10", "pub": "International", "book": "THM", "dean": "10", "issn": "1234 1232", "first": "No", "score": "10", "title": "Book Chapter 1", "coauth": "No", "coauthor": "No", "director": "10", "publisher": "International", "first_author": "No"}, {"hod": "10", "pub": "International", "book": "ABC", "dean": "10", "issn": "1122 3344", "first": "No", "score": "10", "title": "Book Chapter 2", "coauth": "No", "coauthor": "No", "director": "10", "publisher": "International", "first_author": "No"}], "confs": [{"hod": "", "org": "", "dean": "", "type": "", "level": "", "score": "", "title": "", "director": "", "organization": ""}], "quals": [{"hod": "", "dean": "", "label": "Higher Qualification achieved (5 Marks)", "score": "", "director": ""}], "awards": [{"hod": "", "date": "", "dean": "", "level": "", "score": "", "title": "", "agency": "", "director": "", "award_date": ""}], "patents": [{"hod": "30", "date": "01/04/2026", "dean": "30", "type": "National", "score": "30", "title": "Solar Lamp", "fileNo": "1234", "status": "Granted", "file_no": "1234", "director": "30", "patent_date": "01/04/2026", "patent_status": "Granted"}, {"hod": "", "date": "", "dean": "", "type": "", "score": "", "title": "", "fileNo": "", "status": "", "file_no": "", "director": "", "patent_date": "", "patent_status": ""}], "society": [{"hod": "5", "dean": "5", "label": "Induction Program", "score": "5", "details": "Coordinator", "activity": "Induction Program", "director": "5", "participated": "Yes"}, {"hod": "", "dean": "", "label": "Unnat Bharat Abhiyan", "score": "", "details": "", "activity": "Unnat Bharat Abhiyan", "director": "0", "participated": ""}, {"hod": "", "dean": "", "label": "Yoga Classes", "score": "", "details": "", "activity": "Yoga Classes", "director": "", "participated": ""}, {"hod": "", "dean": "", "label": "Blood Donation", "score": "", "details": "", "activity": "Blood Donation", "director": "", "participated": ""}, {"hod": "", "dean": "", "label": "Techno Social activities", "score": "", "details": "", "activity": "Techno Social activities", "director": "", "participated": ""}, {"hod": "", "dean": "", "label": "NSS", "score": "", "details": "", "activity": "NSS", "director": "", "participated": ""}, {"hod": "", "dean": "", "label": "Social visits", "score": "", "details": "", "activity": "Social visits", "director": "", "participated": ""}, {"hod": "", "dean": "", "label": "Project of Social Impact", "score": "", "details": "", "activity": "Project of Social Impact", "director": "", "participated": ""}, {"hod": "", "dean": "", "label": "Any other activity", "score": "", "details": "", "activity": "Any other activity", "director": "", "participated": ""}], "uniActs": [{"hod": "30", "dean": "30", "score": "30", "nature": "Full Time", "activity": "Director IQAC", "director": "30"}, {"hod": "25", "dean": "20", "score": "25", "nature": "Year Long", "activity": "SAE Coordinator", "director": "25"}, {"hod": "", "dean": "", "score": "", "nature": "", "activity": "", "director": ""}], "deptActs": [{"hod": "20", "dean": "20", "score": "20", "nature": "Year Long", "activity": "SAE BAJA", "director": "20"}], "feedback": [{"fb1": "78", "fb2": "82", "hod": "08", "code": "Computational Techniques", "dean": "8", "score": "8.0", "director": "8", "feedback_1": "78", "feedback_2": "82", "course_code": "Computational Techniques"}, {"fb1": "82", "fb2": "85", "hod": "9", "code": "Fluid Mechanics", "dean": "9", "score": "8.3", "director": "9", "feedback_1": "82", "feedback_2": "85", "course_code": "Fluid Mechanics"}, {"fb1": "", "fb2": "", "hod": "", "code": "", "dean": "", "score": "0.0", "director": "", "feedback_1": "", "feedback_2": "", "course_code": ""}], "industry": [{"hod": "5", "dean": "5", "name": "Atlas COPCO", "score": "5", "details": "Curriculum Development", "director": "5"}, {"hod": "5", "dean": "5", "name": "Dassault Systems", "score": "5", "details": "CoE", "director": "5"}], "journals": [{"hod": "10", "dean": "10", "issn": "2233 3344", "index": "Scopus", "score": "10", "title": "Effect of Grain Size", "journal": "Journal of", "director": "10", "indexing": "Scopus"}, {"hod": "10", "dean": "10", "issn": "1123 3245", "index": "Scopus", "score": "10", "title": "ResearchPaper", "journal": "Journal of", "director": "10", "indexing": "Scopus"}], "lectures": [{"hod": "50", "sem": "TY B Tech V", "code": "Computational Techniques", "dean": "50", "score": "50", "planned": "36", "director": "50", "semester": "TY B Tech V", "conducted": "38", "course_code": "Computational Techniques", "planned_classes": "36", "conducted_classes": "38"}, {"hod": "48", "sem": "SY B Tech III", "code": "Fluid Machinery", "dean": "40", "score": "50", "planned": "36", "director": "50", "semester": "SY B Tech III", "conducted": "37", "course_code": "Fluid Machinery", "planned_classes": "36", "conducted_classes": "37"}], "products": [{"hod": "10", "dean": "10", "score": "10", "usage": "Faculty", "details": "Website", "director": "10"}], "projects": [], "research": [], "training": [{"hod": "", "dean": "", "score": "", "nature": "", "company": "", "director": "", "duration": ""}], "projects2": [{"hod": "10", "date": "01/03/2026", "dean": "9", "role": "CO-PI", "score": "10", "title": "Spray Materia", "agency": "DYPIU", "amount": "1000000", "status": "Ongoing", "director": "10", "sanction_date": "01/03/2026", "project_status": "Ongoing"}, {"hod": "", "date": "", "dean": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "status": "", "sanction_date": "", "project_status": ""}], "proposals": [{"hod": "10", "dean": "10", "score": "10", "title": "Spary", "agency": "ANRF", "amount": "5900000", "director": "10", "duration": "2 Years"}, {"hod": "", "dean": "", "score": "", "title": "", "agency": "", "amount": "", "director": "", "duration": ""}], "courseFile": [{"hod": "2", "dean": "2", "score": "2", "title": "SY B Tech", "course": "Fluid Mechanics", "details": "As per IQAC Format", "director": "2"}, {"hod": "2", "dean": "2", "score": "2", "title": "SY B Tech", "course": "Fluid Mechanics", "details": "As per IQAC Format", "director": "2"}], "externalProjects": [{"hod": "10", "date": "15/02/2026", "dean": "9", "role": "Co-PI", "score": "10", "title": "Consultancy", "agency": "GTech", "amount": "205000", "status": "Completed", "director": "10", "sanction_date": "15/02/2026", "project_status": "Completed"}, {"hod": "5", "date": "10/01/2026", "dean": "4", "role": "CO-PI", "score": "5", "title": "Consultancy", "agency": "Fabritek", "amount": "100000", "status": "Completed", "director": "5", "sanction_date": "10/01/2026", "project_status": "Completed"}], "innovativeTeaching": {"dean": "8"}}	Reviewed	2026-05-12 04:56:59.905949+00	2026-05-12 04:56:59.905955+00	2026-05-12 04:56:59.905957+00
e8eed731-3d1e-49d3-858c-5310c88d4a50	ram.kunwer@dypiu.ac.in	2025-2026	deanfaculties_engineering@dypiu.ac.in	dean	164	90	254		{"acr": [{"hod": "", "dean": "5", "label": "Self-motivation and Proactiveness", "score": "", "director": "5"}, {"hod": "", "dean": "5", "label": "Punctuality", "score": "", "director": "5"}, {"hod": "", "dean": "5", "label": "Target based work", "score": "", "director": "5"}, {"hod": "", "dean": "5", "label": "Effectiveness", "score": "", "director": "5"}, {"hod": "", "dean": "5", "label": "Obedience", "score": "", "director": "5"}], "ict": [{"hod": "", "dean": "", "desc": "", "quad": "", "type": "", "score": "", "title": "", "director": "", "quadrant": "", "description": ""}], "fdps": [{"hod": "", "org": "DYPIU", "dean": "5", "score": "5", "program": "FDP1", "director": "5", "duration": "5", "organization": "DYPIU"}, {"hod": "", "org": "DYPIU", "dean": "5", "score": "5", "program": "FDP2", "director": "5", "duration": "5", "organization": "DYPIU"}], "books": [{"hod": "", "pub": "Research", "book": "Springer", "dean": "20", "issn": "9832e784", "first": "Yes", "score": "20", "title": "Book Chapter 1", "coauth": "1", "coauthor": "1", "director": "10", "publisher": "Research", "first_author": "Yes"}, {"hod": "", "pub": "", "book": "", "dean": "", "issn": "", "first": "", "score": "", "title": "", "coauth": "", "coauthor": "", "director": "", "publisher": "", "first_author": ""}], "confs": [{"hod": "", "org": "SYNOPSIS", "dean": "30", "type": "Symposium", "level": "NA", "score": "30", "title": "CFD", "director": "0", "organization": "SYNOPSIS"}], "quals": [{"hod": "", "dean": "", "label": "Higher Qualification achieved (5 Marks)", "score": "", "director": "0"}], "awards": [{"hod": "", "date": "", "dean": "", "level": "", "score": "", "title": "", "agency": "", "director": "0", "award_date": ""}], "patents": [{"hod": "", "date": "", "dean": "", "type": "", "score": "", "title": "", "fileNo": "", "status": "", "file_no": "", "director": "0", "patent_date": "", "patent_status": ""}], "society": [{"hod": "", "dean": "0", "label": "", "score": "0", "details": "NA", "activity": "", "director": "0", "participated": "No"}], "uniActs": [{"hod": "", "dean": "30", "score": "30", "nature": "University", "activity": "NAAC", "director": "30"}], "deptActs": [{"hod": "", "dean": "20", "score": "20", "nature": "M. Tech Smart Manufacturing", "activity": "Program Booklet", "director": "20"}], "feedback": [{"fb1": "80", "fb2": "80", "hod": "", "code": "Vehicle Dynamics", "dean": "8", "score": "8.0", "director": "8", "feedback_1": "80", "feedback_2": "80", "course_code": "Vehicle Dynamics"}, {"fb1": "80", "fb2": "80", "hod": "", "code": "Advanced Manufacturing", "dean": "8", "score": "8.0", "director": "8", "feedback_1": "80", "feedback_2": "80", "course_code": "Advanced Manufacturing"}, {"fb1": "80", "fb2": "80", "hod": "", "code": "FEM", "dean": "8", "score": "8.0", "director": "8", "feedback_1": "80", "feedback_2": "80", "course_code": "FEM"}], "industry": [{"hod": "", "dean": "5", "name": "SYNOPSIS", "score": "5", "details": "LAB", "director": "4"}], "journals": [{"hod": "", "dean": "10", "issn": "01010", "index": "01", "score": "10", "title": "Research article", "journal": "Scientific Report", "director": "8", "indexing": "01"}, {"hod": "", "dean": "10", "issn": "0329309", "index": "92", "score": "10", "title": "Research Article", "journal": "Scientific Report", "director": "8", "indexing": "92"}], "lectures": [{"hod": "", "sem": "VI", "code": "Advanced Manufacturing Processes", "dean": "50", "score": "50", "planned": "30", "director": "45", "semester": "VI", "conducted": "30", "course_code": "Advanced Manufacturing Processes", "planned_classes": "30", "conducted_classes": "30"}, {"hod": "", "sem": "II", "code": "Vehicle Dynamics", "dean": "50", "score": "50", "planned": "30", "director": "45", "semester": "II", "conducted": "30", "course_code": "Vehicle Dynamics", "planned_classes": "30", "conducted_classes": "30"}], "products": [{"hod": "", "dean": "0", "score": "", "usage": "", "details": "", "director": "00"}], "projects": [{"hod": "", "dean": "3", "label": "Project guided (3/batch)", "score": "3", "director": "3"}, {"hod": "", "dean": "3", "label": "Industrial collaboration / Sponsorship (Max 5)", "score": "2", "director": "2"}, {"hod": "", "dean": "3", "label": "Award received (Max 5 marks)", "score": "3", "director": "0"}, {"hod": "", "dean": "2", "label": "Project outcome: events/publications (Max 5)", "score": "2", "director": "2"}], "research": [{"hod": "", "dean": "", "name": "Nikhil Kumar", "score": "20", "degree": "PhD", "thesis": "Thermal Energy Storage", "director": "00", "student_name": "Nikhil Kumar"}, {"hod": "", "dean": "", "name": "Praveen Kumar", "score": "20", "degree": "PhD", "thesis": "WLB", "director": "00", "student_name": "Praveen Kumar"}], "training": [{"hod": "", "dean": "", "score": "", "nature": "", "company": "", "director": "0", "duration": ""}], "projects2": [{"hod": "", "date": "", "dean": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "status": "", "sanction_date": "", "project_status": ""}], "proposals": [{"hod": "", "dean": "10", "score": "10", "title": "Research Proposal", "agency": "Maharashtra", "amount": "2000000", "director": "10", "duration": "2"}], "courseFile": [{"hod": "", "dean": "2", "score": "2", "title": "Advanced Manufacturing Processes", "course": "Course File", "details": "All checklist attached", "director": "2"}, {"hod": "", "dean": "2", "score": "2", "title": "Vehicle Dynamics", "course": "Course File", "details": "All Checklist attached", "director": "2"}, {"hod": "", "dean": "2", "score": "2", "title": "FEA", "course": "Course File`", "details": "All Checklist attached", "director": "2"}], "externalProjects": [{"hod": "", "date": "", "dean": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "status": "", "director": "0", "sanction_date": "", "project_status": ""}], "innovativeTeaching": {"dean": "8"}}	Reviewed	2026-05-12 04:59:00.635707+00	2026-05-12 04:59:00.635712+00	2026-05-12 04:59:00.635714+00
b51c3e16-f97a-47a6-b571-5dcc899326da	providence2405@gmail.com	2025-2026	director_testing@dypiu.ac.in	director	111.5	280	391.5	done changes	{"acr": [{"label": "Self-motivation and Proactiveness", "director": "5"}, {"label": "Punctuality", "director": "4"}, {"label": "Target based work", "director": "5"}, {"label": "Effectiveness", "director": "4"}, {"label": "Obedience", "director": "4"}], "ict": [{"hod": "", "desc": "a", "quad": "a", "type": "a", "score": "20", "title": "a", "director": "20", "quadrant": "a", "description": "a"}], "fdps": [{"hod": "", "org": "a", "score": "5", "program": "a", "director": "5", "duration": "aa", "organization": "a"}], "books": [{"hod": "", "pub": "a", "book": "a", "issn": "a", "first": "No", "score": "50", "title": "a", "coauth": "a", "coauthor": "a", "director": "50", "publisher": "a", "first_author": "No"}], "confs": [{"hod": "", "org": "a", "type": "a", "level": "a", "score": "30", "title": "a", "director": "30", "organization": "a"}], "quals": [{"hod": "", "label": "a", "score": "5", "director": "4.5"}], "awards": [{"hod": "", "date": "10/10/2000", "level": "a", "score": "10", "title": "a", "agency": "a", "director": "10", "award_date": "10/10/2000"}], "patents": [{"hod": "", "date": "20/10/2020", "type": "a", "score": "40", "title": "a", "fileNo": "a", "status": "a", "file_no": "a", "director": "40", "patent_date": "20/10/2020", "patent_status": "a"}], "society": [{"hod": "", "label": "", "score": "0", "details": "", "activity": "", "director": "", "participated": ""}], "uniActs": [{"hod": "", "score": "30", "nature": "a", "activity": "a", "director": "30"}], "deptActs": [{"hod": "", "score": "20", "nature": "a", "activity": "a", "director": "20"}], "feedback": [{"fb1": "96", "fb2": "87", "hod": "", "code": "a", "score": "9.2", "director": "8", "feedback_1": "96", "feedback_2": "87", "course_code": "a"}], "industry": [{"hod": "", "name": "a", "score": "5", "details": "a", "director": "5"}], "journals": [{"hod": "", "issn": "a", "index": "a", "score": "100", "title": "a", "journal": "a", "director": "100", "indexing": "a"}], "lectures": [{"hod": "", "sem": "a", "code": "a", "score": "50", "planned": "30", "director": "30", "semester": "a", "conducted": "30", "course_code": "a", "planned_classes": "30", "conducted_classes": "30"}], "products": [{"hod": "", "score": "10", "usage": "a", "details": "a", "director": "10"}], "projects": [{"hod": "", "label": "", "score": "", "director": ""}], "research": [{"hod": "", "name": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}], "training": [{"hod": "", "score": "5", "nature": "a", "company": "a", "director": "5", "duration": "a"}], "projects2": [{"hod": "", "date": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "status": "", "director": "", "sanction_date": "", "project_status": ""}], "proposals": [{"hod": "", "score": "10", "title": "a", "agency": "a", "amount": "10000", "director": "10", "duration": "a"}], "courseFile": [{"hod": "", "score": "20", "title": "2020", "course": "a", "details": "1.Available", "director": "20"}], "externalProjects": [{"hod": "", "date": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "status": "", "director": "", "sanction_date": "", "project_status": ""}], "innovativeTeaching": {"director": "2"}}	Reviewed	2026-05-12 05:32:07.527513+00	2026-05-12 05:32:07.527517+00	2026-05-12 05:32:07.527519+00
\.


--
-- Data for Name: appraisal_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appraisal_snapshots (id, faculty_email, academic_year, payload, created_at, updated_at) FROM stdin;
62523cf5-10a0-44e2-9b90-224bd989daa8	tejashri.gulve@dypiu.ac.in	2025-2026	{"docs": {"fdp-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/fdp-0/cd83cb7e-9e49-4c16-8961-4c39ea6a8c9b_certificate1.STTP_TSG.pdf", "name": "certificate1.STTP TSG.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/fdp-0/cd83cb7e-9e49-4c16-8961-4c39ea6a8c9b_certificate1.STTP_TSG.pdf"}], "ict-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ict-0/109e13cf-0517-4af3-9add-4a2878bf9fa6_TSG_ICT_TOOLS_AY_25-26%2C_SEM_II.pdf", "name": "TSG_ICT TOOLS_AY 25-26, SEM II.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/ict-0/109e13cf-0517-4af3-9add-4a2878bf9fa6_TSG_ICT_TOOLS_AY_25-26,_SEM_II.pdf"}], "ind-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-0/4ce6c346-5b54-4b78-bd0f-c9afd97093a4_Guest_Lecture_Report__Ultra_Tech_Cement.pdf", "name": "Guest Lecture Report  Ultra Tech Cement.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/ind-0/4ce6c346-5b54-4b78-bd0f-c9afd97093a4_Guest_Lecture_Report__Ultra_Tech_Cement.pdf"}], "lec-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-0/1d72db37-4404-48af-8b46-86e7adfdd818_Tejashri_Satish_Gulve_Structural_Analysis_%28Theory%29-%28A%29__%281%29.pdf", "name": "Tejashri Satish Gulve_Structural Analysis (Theory)-(A)  (1).pdf", "type": "application/pdf", "publicId": "faculty-appraisal/lec-0/1d72db37-4404-48af-8b46-86e7adfdd818_Tejashri_Satish_Gulve_Structural_Analysis_(Theory)-(A)__(1).pdf"}], "soc-6": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/soc-6/7460483b-d4cb-4523-b335-94371c83c367_DRCS_SITE_VISIT_REPORT_17th_May..pdf", "name": "DRCS SITE VISIT REPORT 17th May..pdf", "type": "application/pdf", "publicId": "faculty-appraisal/soc-6/7460483b-d4cb-4523-b335-94371c83c367_DRCS_SITE_VISIT_REPORT_17th_May..pdf"}], "uni-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-0/1860960c-4712-47be-bdaa-d93fc36d9eba_INnovation_order.pdf", "name": "INnovation order.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/uni-0/1860960c-4712-47be-bdaa-d93fc36d9eba_INnovation_order.pdf"}], "book-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-0/829ce043-dbe6-496a-8eaf-0faf666d91b3_4.NEW__YOGESH%28sneha%29.pdf", "name": "4.NEW  YOGESH(sneha).pdf", "type": "application/pdf", "publicId": "faculty-appraisal/book-0/829ce043-dbe6-496a-8eaf-0faf666d91b3_4.NEW__YOGESH(sneha).pdf"}], "dept-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/dept-0/0239f5f3-8151-46e8-96c9-499185e6476c_Guest_Lecture_Report__Ultra_Tech_Cement.pdf", "name": "Guest Lecture Report  Ultra Tech Cement.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/dept-0/0239f5f3-8151-46e8-96c9-499185e6476c_Guest_Lecture_Report__Ultra_Tech_Cement.pdf"}], "qual-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/qual-0/2ab4af17-4b08-450b-a102-3325eefc62e0_INnovation_order.pdf", "name": "INnovation order.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/qual-0/2ab4af17-4b08-450b-a102-3325eefc62e0_INnovation_order.pdf"}], "qual-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/qual-1/c368b14e-e5d5-437e-b758-21962c7f3aa2_PCCOE_Conference_Certificate_%281%29.pdf", "name": "PCCOE Conference Certificate (1).pdf", "type": "application/pdf", "publicId": "faculty-appraisal/qual-1/c368b14e-e5d5-437e-b758-21962c7f3aa2_PCCOE_Conference_Certificate_(1).pdf"}], "innov-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-0/eaab0084-8461-4d05-86ef-151dce779cf0_TSG_ICT_TOOLS_AY_25-26%2C_SEM_II.pdf", "name": "TSG_ICT TOOLS_AY 25-26, SEM II.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/innov-0/eaab0084-8461-4d05-86ef-151dce779cf0_TSG_ICT_TOOLS_AY_25-26,_SEM_II.pdf"}], "courseFile-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/courseFile-0/66ff5d21-1e4d-4979-9551-6b64caae9c7a_Course_File_Content.docx", "name": "Course File Content.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/courseFile-0/66ff5d21-1e4d-4979-9551-6b64caae9c7a_Course_File_Content.docx"}]}, "form": {"acr": [{"hod": "", "label": "Self-motivation and Proactiveness", "score": "", "director": ""}, {"hod": "", "label": "Punctuality", "score": "", "director": ""}, {"hod": "", "label": "Target based work", "score": "", "director": ""}, {"hod": "", "label": "Effectiveness", "score": "", "director": ""}, {"hod": "", "label": "Obedience", "score": "", "director": ""}], "ict": [{"hod": "", "type": "website", "score": "20", "title": "ICT", "director": "", "quadrant": "1", "description": "Report"}, {"hod": "", "type": "", "score": "", "title": "", "director": "", "quadrant": "", "description": ""}], "fdps": [{"hod": "", "score": "5", "program": "FDP", "director": "", "duration": "5", "organization": "PCCOE"}, {"hod": "", "score": "", "program": "", "director": "", "duration": "", "organization": ""}], "info": {"ay": "2025-2026", "name": "Tejashri Gulve", "qual": "", "desig": "Assistant Professor", "expDyp": "", "school": "SoEMR — School of Engineering Management & Research", "expPrev": "", "expTotal": ""}, "books": [{"hod": "", "book": "abcdd", "issn": "2014", "score": "20", "title": "book chapter", "coauthor": "no", "director": "", "publisher": "national", "first_author": "Yes"}, {"hod": "", "book": "", "issn": "", "score": "", "title": "", "coauthor": "", "director": "", "publisher": "", "first_author": ""}], "confs": [{"hod": "", "type": "", "level": "", "score": "", "title": "", "director": "", "organization": ""}, {"hod": "", "type": "", "level": "", "score": "", "title": "", "director": "", "organization": ""}, {"hod": "", "type": "", "level": "", "score": "", "title": "", "director": "", "organization": ""}], "quals": [{"hod": "", "label": "Higher Qualification achieved (5 Marks)", "score": "5", "director": ""}, {"hod": "", "label": "Add-on Qualification / Certification (Max 5)", "score": "5", "director": ""}], "awards": [{"hod": "", "level": "", "score": "", "title": "", "agency": "", "director": "", "award_date": ""}, {"hod": "", "level": "", "score": "", "title": "", "agency": "", "director": "", "award_date": ""}], "patents": [{"hod": "", "type": "", "score": "", "title": "", "file_no": "", "director": "", "patent_date": "", "patent_status": ""}, {"hod": "", "type": "", "score": "", "title": "", "file_no": "", "director": "", "patent_date": "", "patent_status": ""}], "society": [{"hod": "", "score": "", "details": "", "activity": "Induction Program", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "Unnat Bharat Abhiyan", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "Yoga Classes", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "Blood Donation", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "Techno Social activities", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "NSS", "director": "", "participated": ""}, {"hod": "", "score": "5", "details": "visit", "activity": "Social visits", "director": "", "participated": "Yes"}, {"hod": "", "score": "", "details": "", "activity": "Project of Social Impact", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "Any other activity", "director": "", "participated": ""}], "uniActs": [{"hod": "", "score": "30", "nature": "Summit 2026", "activity": "School Level", "director": ""}, {"hod": "", "score": "", "nature": "", "activity": "", "director": ""}, {"hod": "", "score": "", "nature": "", "activity": "", "director": ""}], "deptActs": [{"hod": "", "score": "20", "nature": "Co Curricular", "activity": "Guest Lecture", "director": ""}, {"hod": "", "score": "", "nature": "", "activity": "", "director": ""}, {"hod": "", "score": "", "nature": "", "activity": "", "director": ""}], "feedback": [{"hod": "", "score": "10.0", "director": "", "feedback_1": "100", "feedback_2": "100", "course_code": "Structural Analysis"}, {"hod": "", "score": "0.0", "director": "", "feedback_1": "", "feedback_2": "", "course_code": ""}, {"hod": "", "score": "0.0", "director": "", "feedback_1": "", "feedback_2": "", "course_code": ""}], "industry": [{"hod": "", "name": "MOU", "score": "5", "details": "Guest Lecture", "director": ""}, {"hod": "", "name": "", "score": "", "details": "", "director": ""}], "journals": [{"hod": "", "issn": "", "score": "", "title": "", "journal": "", "director": "", "indexing": ""}, {"hod": "", "issn": "", "score": "", "title": "", "journal": "", "director": "", "indexing": ""}, {"hod": "", "issn": "", "score": "", "title": "", "journal": "", "director": "", "indexing": ""}], "lectures": [{"hod": "", "score": "25", "director": "", "semester": "IV", "course_code": "ECE2101T/ Structural Analysis", "planned_classes": "48", "conducted_classes": "49"}, {"hod": "", "score": "", "director": "", "semester": "", "course_code": "", "planned_classes": "", "conducted_classes": ""}, {"hod": "", "score": "", "director": "", "semester": "", "course_code": "", "planned_classes": "", "conducted_classes": ""}], "products": [{"hod": "", "score": "", "usage": "", "details": "", "director": ""}, {"hod": "", "score": "", "usage": "", "details": "", "director": ""}], "projects": [{"hod": "", "label": "", "score": "", "director": ""}, {"hod": "", "label": "", "score": "", "director": ""}, {"hod": "", "label": "", "score": "", "director": ""}, {"hod": "", "label": "", "score": "", "director": ""}], "research": [{"hod": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}, {"hod": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}], "training": [{"hod": "", "score": "", "nature": "", "company": "", "director": "", "duration": ""}, {"hod": "", "score": "", "nature": "", "company": "", "director": "", "duration": ""}], "innovRows": [{"score": "2", "method": "Innovative methods", "details": "SA lecture report"}], "projects2": [{"hod": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "sanction_date": "", "project_status": ""}, {"hod": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "sanction_date": "", "project_status": ""}], "proposals": [{"hod": "", "score": "", "title": "", "agency": "", "amount": "", "director": "", "duration": ""}, {"hod": "", "score": "", "title": "", "agency": "", "amount": "", "director": "", "duration": ""}], "courseFile": [{"hod": "", "score": "2", "title": "Structural Analysis", "course": "SY", "details": "coarse File", "director": ""}], "innovScore": "2", "innovDetails": "", "externalProjects": [{"hod": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "sanction_date": "", "project_status": ""}, {"hod": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "sanction_date": "", "project_status": ""}], "internalProjects": [], "sectionSaveStatus": {"partA": true, "partB": true}, "sectionApplicability": {"projects": "notApplicable", "research": "notApplicable"}}, "status": "Pending HOD Review", "totals": {"grandTotal": 154, "partATotal": 109, "partBTotal": 45}, "review_chain": ["hod", "director", "dean", "vc"], "academic_year": "2025-2026", "next_reviewer": "hod", "workflow_status": "Pending HOD Review", "submitter_profile": {"email": "tejashri.gulve@dypiu.ac.in", "school": "SoEMR — School of Engineering Management & Research", "full_name": "Tejashri Gulve", "department": "Civil Engineering", "designation": "", "employee_id": "", "appraisal_role": "faculty"}, "next_reviewer_role": "hod"}	2026-05-11 11:40:49.192586+00	2026-05-11 11:40:49.192591+00
24475fd2-2fba-4f0e-a3f3-f52de78dc19b	sunil.dambhare@dypiu.ac.in	2025-2026	{"docs": {"fdp-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/fdp-0/32e98161-675f-4cd1-bcb6-9bdd36a3c750_FDP_Paper.pdf", "name": "FDP Paper.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/fdp-0/32e98161-675f-4cd1-bcb6-9bdd36a3c750_FDP_Paper.pdf"}], "fdp-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/fdp-1/2845962c-ecc9-4d09-bf0e-853f79741d6b_FDP_Paper.pdf", "name": "FDP Paper.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/fdp-1/2845962c-ecc9-4d09-bf0e-853f79741d6b_FDP_Paper.pdf"}], "ind-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-0/998bf61c-8f12-447e-b367-04877c0b600a_FDP_Paper.pdf", "name": "FDP Paper.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/ind-0/998bf61c-8f12-447e-b367-04877c0b600a_FDP_Paper.pdf"}], "ind-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-1/fa7252b5-ee57-4ff5-8547-09d7611a895f_effect_of_grain_size_paper.pdf", "name": "effect of grain size paper.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/ind-1/fa7252b5-ee57-4ff5-8547-09d7611a895f_effect_of_grain_size_paper.pdf"}], "lec-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-0/0836ddf8-caa8-4907-9c79-264c7ffeabff_Computational_Theory_Lecture_Report_Sem_I_AY_2025-26.pdf", "name": "Computational Theory Lecture Report Sem I AY 2025-26.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/lec-0/0836ddf8-caa8-4907-9c79-264c7ffeabff_Computational_Theory_Lecture_Report_Sem_I_AY_2025-26.pdf"}], "lec-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-1/4b21a1f8-7105-44a8-b661-8704254c83e7_Computational_Theory_Lecture_Report_Sem_I_AY_2025-26.pdf", "name": "Computational Theory Lecture Report Sem I AY 2025-26.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/lec-1/4b21a1f8-7105-44a8-b661-8704254c83e7_Computational_Theory_Lecture_Report_Sem_I_AY_2025-26.pdf"}], "pat-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/pat-0/d9ae694d-432f-4241-9d10-1c23538421ce_effect_of_grain_size_paper.pdf", "name": "effect of grain size paper.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/pat-0/d9ae694d-432f-4241-9d10-1c23538421ce_effect_of_grain_size_paper.pdf"}], "soc-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/soc-0/9325a397-4ae4-4051-8c2b-b13cba2a25b1_Department_Duties.pdf", "name": "Department Duties.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/soc-0/9325a397-4ae4-4051-8c2b-b13cba2a25b1_Department_Duties.pdf"}], "uni-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-0/6b583844-2860-4645-b222-a1d14a9b0faa_Department_Duties.pdf", "name": "Department Duties.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/uni-0/6b583844-2860-4645-b222-a1d14a9b0faa_Department_Duties.pdf"}], "uni-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-1/ab5d7d91-63fc-4b4b-8173-8beb8640c76b_Department_Duties.pdf", "name": "Department Duties.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/uni-1/ab5d7d91-63fc-4b4b-8173-8beb8640c76b_Department_Duties.pdf"}], "book-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-0/c7d95455-e0ab-40d3-8e41-4a0c9b751afb_Evaluation_Sheet_with_components.pdf", "name": "Evaluation Sheet with components.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/book-0/c7d95455-e0ab-40d3-8e41-4a0c9b751afb_Evaluation_Sheet_with_components.pdf"}], "book-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-1/0a42c3b5-371a-462f-8146-fcee76f9134f_Computational_Theory_Lecture_Report_Sem_I_AY_2025-26.pdf", "name": "Computational Theory Lecture Report Sem I AY 2025-26.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/book-1/0a42c3b5-371a-462f-8146-fcee76f9134f_Computational_Theory_Lecture_Report_Sem_I_AY_2025-26.pdf"}], "dept-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/dept-0/3898be8a-d772-48b9-9824-4b86677d87ab_Department_Duties.pdf", "name": "Department Duties.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/dept-0/3898be8a-d772-48b9-9824-4b86677d87ab_Department_Duties.pdf"}], "jour-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/jour-0/2fb8a2c6-da1b-4273-883a-c8f5957e8331_effect_of_grain_size_paper.pdf", "name": "effect of grain size paper.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/jour-0/2fb8a2c6-da1b-4273-883a-c8f5957e8331_effect_of_grain_size_paper.pdf"}], "jour-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/jour-1/b4452acf-1d44-4cca-85c2-5bb6679e8708_effect_of_grain_size_paper.pdf", "name": "effect of grain size paper.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/jour-1/b4452acf-1d44-4cca-85c2-5bb6679e8708_effect_of_grain_size_paper.pdf"}], "prod-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prod-0/b0e6251f-e759-4890-89c7-30c6aa19894d_Evaluation_Sheet_with_components.pdf", "name": "Evaluation Sheet with components.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/prod-0/b0e6251f-e759-4890-89c7-30c6aa19894d_Evaluation_Sheet_with_components.pdf"}], "prop-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prop-0/13b6596a-85ee-471a-9556-38bd00f217cf_Department_Duties.pdf", "name": "Department Duties.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/prop-0/13b6596a-85ee-471a-9556-38bd00f217cf_Department_Duties.pdf"}], "innov-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-0/42e32dee-7b81-4819-a4af-ca361571d285_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_End_Term%28Theory%29.pdf", "name": "Dr Sunil Dambhare End Term TY Computational Techniques End Term(Theory).pdf", "type": "application/pdf", "publicId": "faculty-appraisal/innov-0/42e32dee-7b81-4819-a4af-ca361571d285_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_End_Term(Theory).pdf"}], "innov-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-1/75f29d3d-a77b-4bcd-ae8b-bfc45011d9d5_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_Mid_Term%28Theory%29.pdf", "name": "Dr Sunil Dambhare End Term TY Computational Techniques Mid Term(Theory).pdf", "type": "application/pdf", "publicId": "faculty-appraisal/innov-1/75f29d3d-a77b-4bcd-ae8b-bfc45011d9d5_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_Mid_Term(Theory).pdf"}], "innov-2": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-2/92358acc-04a7-4f4a-be2b-b03b302dcabf_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_Mid_Term%28Theory%29.pdf", "name": "Dr Sunil Dambhare End Term TY Computational Techniques Mid Term(Theory).pdf", "type": "application/pdf", "publicId": "faculty-appraisal/innov-2/92358acc-04a7-4f4a-be2b-b03b302dcabf_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_Mid_Term(Theory).pdf"}], "innov-3": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-3/67a581fe-29c9-4756-bde0-0391091cbbde_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_End_Term%28Theory%29.pdf", "name": "Dr Sunil Dambhare End Term TY Computational Techniques End Term(Theory).pdf", "type": "application/pdf", "publicId": "faculty-appraisal/innov-3/67a581fe-29c9-4756-bde0-0391091cbbde_Dr_Sunil_Dambhare_End_Term_TY_Computational_Techniques_End_Term(Theory).pdf"}], "project2-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/project2-0/bab76075-9fe0-45c7-b898-48f41fd406cd_Evaluation_Sheet_with_components.pdf", "name": "Evaluation Sheet with components.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/project2-0/bab76075-9fe0-45c7-b898-48f41fd406cd_Evaluation_Sheet_with_components.pdf"}], "externalProject-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/externalProject-0/f1f7c8a3-ff3e-46aa-8dea-c5a5e5d04ddc_FDP_Paper.pdf", "name": "FDP Paper.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/externalProject-0/f1f7c8a3-ff3e-46aa-8dea-c5a5e5d04ddc_FDP_Paper.pdf"}], "externalProject-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/externalProject-1/6f9cd56c-1ecb-43f6-9b5a-33d4e20d82d3_Department_Duties.pdf", "name": "Department Duties.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/externalProject-1/6f9cd56c-1ecb-43f6-9b5a-33d4e20d82d3_Department_Duties.pdf"}]}, "form": {"acr": [{"hod": "", "label": "Self-motivation and Proactiveness", "score": "", "director": ""}, {"hod": "", "label": "Punctuality", "score": "", "director": ""}, {"hod": "", "label": "Target based work", "score": "", "director": ""}, {"hod": "", "label": "Effectiveness", "score": "", "director": ""}, {"hod": "", "label": "Obedience", "score": "", "director": ""}], "ict": [{"hod": "", "type": "e content", "score": "20", "title": "Website", "director": "", "quadrant": "IV", "description": "www.dypiu.ac.in"}], "fdps": [{"hod": "", "score": "5", "program": "FDP 1", "director": "", "duration": "1 week", "organization": "DYPIU"}, {"hod": "", "score": "5", "program": "FDP 2", "director": "", "duration": "1 week", "organization": "DYPIU"}], "info": {"ay": "2025-2026", "name": "Dr. Sunil Dambhare", "qual": "", "desig": "Assistant Professor", "expDyp": "", "school": "SoEMR — School of Engineering Management & Research", "expPrev": "", "expTotal": ""}, "books": [{"hod": "", "book": "THM", "issn": "1234 1232", "score": "10", "title": "Book Chapter 1", "coauthor": "No", "director": "", "publisher": "International", "first_author": "No"}, {"hod": "", "book": "ABC", "issn": "1122 3344", "score": "10", "title": "Book Chapter 2", "coauthor": "No", "director": "", "publisher": "International", "first_author": "No"}], "confs": [{"hod": "", "type": "", "level": "", "score": "", "title": "", "director": "", "organization": ""}], "quals": [{"hod": "", "label": "Higher Qualification achieved (5 Marks)", "score": "", "director": ""}], "awards": [{"hod": "", "level": "", "score": "", "title": "", "agency": "", "director": "", "award_date": ""}], "patents": [{"hod": "", "type": "National", "score": "30", "title": "Solar Lamp", "file_no": "1234", "director": "", "patent_date": "01/04/2026", "patent_status": "Granted"}, {"hod": "", "type": "", "score": "", "title": "", "file_no": "", "director": "", "patent_date": "", "patent_status": ""}], "society": [{"hod": "", "score": "5", "details": "Coordinator", "activity": "Induction Program", "director": "", "participated": "Yes"}, {"hod": "", "score": "", "details": "", "activity": "Unnat Bharat Abhiyan", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "Yoga Classes", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "Blood Donation", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "Techno Social activities", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "NSS", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "Social visits", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "Project of Social Impact", "director": "", "participated": ""}, {"hod": "", "score": "", "details": "", "activity": "Any other activity", "director": "", "participated": ""}], "uniActs": [{"hod": "", "score": "30", "nature": "Full Time", "activity": "Director IQAC", "director": ""}, {"hod": "", "score": "25", "nature": "Year Long", "activity": "SAE Coordinator", "director": ""}, {"hod": "", "score": "", "nature": "", "activity": "", "director": ""}], "deptActs": [{"hod": "", "score": "20", "nature": "Year Long", "activity": "SAE BAJA", "director": ""}], "feedback": [{"hod": "", "score": "8.0", "director": "", "feedback_1": "78", "feedback_2": "82", "course_code": "Computational Techniques"}, {"hod": "", "score": "8.3", "director": "", "feedback_1": "82", "feedback_2": "85", "course_code": "Fluid Mechanics"}, {"hod": "", "score": "0.0", "director": "", "feedback_1": "", "feedback_2": "", "course_code": ""}], "industry": [{"hod": "", "name": "Atlas COPCO", "score": "5", "details": "Curriculum Development", "director": ""}, {"hod": "", "name": "Dassault Systems", "score": "5", "details": "CoE", "director": ""}], "journals": [{"hod": "", "issn": "2233 3344", "score": "10", "title": "Effect of Grain Size", "journal": "Journal of", "director": "", "indexing": "Scopus"}, {"hod": "", "issn": "1123 3245", "score": "10", "title": "ResearchPaper", "journal": "Journal of", "director": "", "indexing": "Scopus"}], "lectures": [{"hod": "", "score": "50", "director": "", "semester": "TY B Tech V", "course_code": "Computational Techniques", "planned_classes": "36", "conducted_classes": "38"}, {"hod": "", "score": "50", "director": "", "semester": "SY B Tech III", "course_code": "Fluid Machinery", "planned_classes": "36", "conducted_classes": "37"}], "products": [{"hod": "", "score": "10", "usage": "Faculty", "details": "Website", "director": ""}], "projects": [{"hod": "", "label": "", "score": "", "director": ""}, {"hod": "", "label": "", "score": "", "director": ""}, {"hod": "", "label": "", "score": "", "director": ""}, {"hod": "", "label": "", "score": "", "director": ""}], "research": [{"hod": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}, {"hod": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}], "training": [{"hod": "", "score": "", "nature": "", "company": "", "director": "", "duration": ""}], "innovRows": [{"score": "2", "method": "ICT", "details": "Sem V"}, {"score": "2", "method": "FM", "details": "Sem III"}, {"score": "2", "method": "CT", "details": "Sem V"}, {"score": "2", "method": "FM", "details": "Sem III"}], "projects2": [{"hod": "", "role": "CO-PI", "score": "10", "title": "Spray Materia", "agency": "DYPIU", "amount": "1000000", "sanction_date": "01/03/2026", "project_status": "Ongoing"}, {"hod": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "sanction_date": "", "project_status": ""}], "proposals": [{"hod": "", "score": "10", "title": "Spary", "agency": "ANRF", "amount": "5900000", "director": "", "duration": "2 Years"}, {"hod": "", "score": "", "title": "", "agency": "", "amount": "", "director": "", "duration": ""}], "courseFile": [{"hod": "", "score": "2", "title": "SY B Tech", "course": "Fluid Mechanics", "details": "As per IQAC Format", "director": ""}, {"hod": "", "score": "2", "title": "SY B Tech", "course": "Fluid Mechanics", "details": "As per IQAC Format", "director": ""}], "innovScore": "8", "innovDetails": "", "externalProjects": [{"hod": "", "role": "Co-PI", "score": "10", "title": "Consultancy", "agency": "GTech", "amount": "205000", "sanction_date": "15/02/2026", "project_status": "Completed"}, {"hod": "", "role": "CO-PI", "score": "5", "title": "Consultancy", "agency": "Fabritek", "amount": "100000", "sanction_date": "10/01/2026", "project_status": "Completed"}], "internalProjects": [], "sectionSaveStatus": {"partA": true, "partB": true}, "sectionApplicability": {"projects": "notApplicable", "research": "notApplicable"}}, "status": "Pending HOD Review", "totals": {"grandTotal": 273.175, "partATotal": 128.175, "partBTotal": 145}, "review_chain": ["hod", "director", "dean", "vc"], "academic_year": "2025-2026", "next_reviewer": "hod", "workflow_status": "Pending HOD Review", "submitter_profile": {"email": "sunil.dambhare@dypiu.ac.in", "school": "SoEMR — School of Engineering Management & Research", "full_name": "Dr. Sunil Dambhare", "department": "Mechanical Engineering", "designation": "Professor", "employee_id": "20251002", "appraisal_role": "faculty"}, "next_reviewer_role": "hod"}	2026-05-11 11:51:53.871705+00	2026-05-11 11:51:53.87171+00
a81dc565-5ddc-48ff-a23e-29efc140bf8f	ram.kunwer@dypiu.ac.in	2025-2026	{"docs": {"ind-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-0/4e2cfbc9-85e9-4200-aca5-10e40e4cafcc_Industry_Connect.pdf", "name": "Industry Connect.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/ind-0/4e2cfbc9-85e9-4200-aca5-10e40e4cafcc_Industry_Connect.pdf"}], "lec-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-0/fb95a9b9-13d2-41d5-8636-395737527ae1_Lectures%2C_Tutorials%2C_Practicals%2C_Projects.pdf", "name": "Lectures, Tutorials, Practicals, Projects.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/lec-0/fb95a9b9-13d2-41d5-8636-395737527ae1_Lectures,_Tutorials,_Practicals,_Projects.pdf"}], "lec-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-1/34d57d32-2333-4596-b183-18509e6c065b_Lectures%2C_Tutorials%2C_Practicals%2C_Projects.pdf", "name": "Lectures, Tutorials, Practicals, Projects.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/lec-1/34d57d32-2333-4596-b183-18509e6c065b_Lectures,_Tutorials,_Practicals,_Projects.pdf"}], "res-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/res-0/4fbf518d-7acc-44ab-9e12-cb64158a86a7_Research_Guidance.pdf", "name": "Research Guidance.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/res-0/4fbf518d-7acc-44ab-9e12-cb64158a86a7_Research_Guidance.pdf"}], "res-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/res-1/9d0d3121-02da-4acc-ae95-3cbca1bfc7e2_Research_Guidance.pdf", "name": "Research Guidance.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/res-1/9d0d3121-02da-4acc-ae95-3cbca1bfc7e2_Research_Guidance.pdf"}], "uni-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-0/cad8e37c-d424-4033-acaf-5c00516a439c_University_Activities.pdf", "name": "University Activities.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/uni-0/cad8e37c-d424-4033-acaf-5c00516a439c_University_Activities.pdf"}], "book-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-0/ea251806-9b8b-49fb-b25d-b4eb8364de4b_book.pdf", "name": "book.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/book-0/ea251806-9b8b-49fb-b25d-b4eb8364de4b_book.pdf"}], "conf-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/conf-0/5eb6e2f8-4998-4e46-961c-6580f62f7964_Invited_Lectures.pdf", "name": "Invited Lectures.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/conf-0/5eb6e2f8-4998-4e46-961c-6580f62f7964_Invited_Lectures.pdf"}], "dept-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/dept-0/8206db10-e54c-43a1-8faa-698e9da2909d_Student_Feedback.pdf", "name": "Student Feedback.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/dept-0/8206db10-e54c-43a1-8faa-698e9da2909d_Student_Feedback.pdf"}], "jour-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/jour-0/91953b2f-438e-401a-b986-eb89b643c1a2_Research_Papers.pdf", "name": "Research Papers.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/jour-0/91953b2f-438e-401a-b986-eb89b643c1a2_Research_Papers.pdf"}], "proj-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-0/15ab1a34-09b7-488b-85a0-4be5dfbde919_Projects.pdf", "name": "Projects.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/proj-0/15ab1a34-09b7-488b-85a0-4be5dfbde919_Projects.pdf"}], "proj-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-1/e0fa95fe-e3b4-4396-bc73-bc9a8893d107_Projects.pdf", "name": "Projects.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/proj-1/e0fa95fe-e3b4-4396-bc73-bc9a8893d107_Projects.pdf"}], "proj-2": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-2/3e9aafa4-2017-47b4-afef-1ab507991ee8_Projects.pdf", "name": "Projects.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/proj-2/3e9aafa4-2017-47b4-afef-1ab507991ee8_Projects.pdf"}], "proj-3": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-3/452fa31a-4b06-462f-af02-4483fdfd38d4_Projects.pdf", "name": "Projects.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/proj-3/452fa31a-4b06-462f-af02-4483fdfd38d4_Projects.pdf"}], "prop-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prop-0/98bea9e9-3e11-403f-bcb5-39fbe2f50fe5_Research_Papers.pdf", "name": "Research Papers.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/prop-0/98bea9e9-3e11-403f-bcb5-39fbe2f50fe5_Research_Papers.pdf"}], "innov-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-0/cecc7489-36a6-4833-aff8-1ae5628a325a_Innovative_Teaching-Learning_Methodologies.pdf", "name": "Innovative Teaching-Learning Methodologies.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/innov-0/cecc7489-36a6-4833-aff8-1ae5628a325a_Innovative_Teaching-Learning_Methodologies.pdf"}], "innov-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-1/965e6c74-d483-4615-8fbb-de599e859a67_Innovative_Teaching-Learning_Methodologies.pdf", "name": "Innovative Teaching-Learning Methodologies.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/innov-1/965e6c74-d483-4615-8fbb-de599e859a67_Innovative_Teaching-Learning_Methodologies.pdf"}], "courseFile-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/courseFile-0/973e7a4d-4ce7-4d7f-8164-5d7eba2bab82_Course_File.pdf", "name": "Course File.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/courseFile-0/973e7a4d-4ce7-4d7f-8164-5d7eba2bab82_Course_File.pdf"}], "courseFile-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/courseFile-1/9cde5178-1a4d-4d75-b20d-b15ba5ce13e3_Course_File.pdf", "name": "Course File.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/courseFile-1/9cde5178-1a4d-4d75-b20d-b15ba5ce13e3_Course_File.pdf"}], "courseFile-2": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/courseFile-2/0e2b21ca-22b0-49fe-a63a-b239ef9da57a_Course_File.pdf", "name": "Course File.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/courseFile-2/0e2b21ca-22b0-49fe-a63a-b239ef9da57a_Course_File.pdf"}]}, "form": {"acr": [{"hod": "", "label": "Self-motivation and Proactiveness", "score": "", "director": ""}, {"hod": "", "label": "Punctuality", "score": "", "director": ""}, {"hod": "", "label": "Target based work", "score": "", "director": ""}, {"hod": "", "label": "Effectiveness", "score": "", "director": ""}, {"hod": "", "label": "Obedience", "score": "", "director": ""}], "ict": [{"hod": "", "type": "", "score": "", "title": "", "director": "", "quadrant": "", "description": ""}], "fdps": [{"hod": "", "score": "5", "program": "FDP1", "director": "", "duration": "5", "organization": "DYPIU"}, {"hod": "", "score": "5", "program": "FDP2", "director": "", "duration": "5", "organization": "DYPIU"}], "info": {"ay": "2025-2026", "name": "Dr. Ram Kunwer", "qual": "", "desig": "Assistant Professor", "expDyp": "", "school": "SoCE — School of Continual Education", "expPrev": "", "expTotal": ""}, "books": [{"hod": "", "book": "Springer", "issn": "9832e784", "score": "20", "title": "Book Chapter 1", "coauthor": "1", "director": "", "publisher": "Research", "first_author": "Yes"}, {"hod": "", "book": "", "issn": "", "score": "", "title": "", "coauthor": "", "director": "", "publisher": "", "first_author": ""}], "confs": [{"hod": "", "type": "Symposium", "level": "NA", "score": "30", "title": "CFD", "director": "", "organization": "SYNOPSIS"}], "quals": [{"hod": "", "label": "Higher Qualification achieved (5 Marks)", "score": "", "director": ""}], "awards": [{"hod": "", "level": "", "score": "", "title": "", "agency": "", "director": "", "award_date": ""}], "patents": [{"hod": "", "type": "", "score": "", "title": "", "file_no": "", "director": "", "patent_date": "", "patent_status": ""}], "society": [{"hod": "", "score": "0", "details": "NA", "activity": "", "director": "", "participated": "No"}], "uniActs": [{"hod": "", "score": "30", "nature": "University", "activity": "NAAC", "director": ""}], "deptActs": [{"hod": "", "score": "20", "nature": "M. Tech Smart Manufacturing", "activity": "Program Booklet", "director": ""}], "feedback": [{"hod": "", "score": "8.0", "director": "", "feedback_1": "80", "feedback_2": "80", "course_code": "Vehicle Dynamics"}, {"hod": "", "score": "8.0", "director": "", "feedback_1": "80", "feedback_2": "80", "course_code": "Advanced Manufacturing"}, {"hod": "", "score": "8.0", "director": "", "feedback_1": "80", "feedback_2": "80", "course_code": "FEM"}], "industry": [{"hod": "", "name": "SYNOPSIS", "score": "5", "details": "LAB", "director": ""}], "journals": [{"hod": "", "issn": "01010", "score": "10", "title": "Research article", "journal": "Scientific Report", "director": "", "indexing": "01"}, {"hod": "", "issn": "0329309", "score": "10", "title": "Research Article", "journal": "Scientific Report", "director": "", "indexing": "92"}], "lectures": [{"hod": "", "score": "50", "director": "", "semester": "VI", "course_code": "Advanced Manufacturing Processes", "planned_classes": "30", "conducted_classes": "30"}, {"hod": "", "score": "50", "director": "", "semester": "II", "course_code": "Vehicle Dynamics", "planned_classes": "30", "conducted_classes": "30"}], "products": [{"hod": "", "score": "", "usage": "", "details": "", "director": ""}], "projects": [{"hod": "", "label": "Project guided (3/batch)", "score": "3", "director": ""}, {"hod": "", "label": "Industrial collaboration / Sponsorship (Max 5)", "score": "2", "director": ""}, {"hod": "", "label": "Award received (Max 5 marks)", "score": "3", "director": ""}, {"hod": "", "label": "Project outcome: events/publications (Max 5)", "score": "2", "director": ""}], "research": [{"hod": "", "score": "20", "degree": "PhD", "thesis": "Thermal Energy Storage", "director": "", "student_name": "Nikhil Kumar"}, {"hod": "", "score": "20", "degree": "PhD", "thesis": "WLB", "director": "", "student_name": "Praveen Kumar"}], "training": [{"hod": "", "score": "", "nature": "", "company": "", "director": "", "duration": ""}], "innovRows": [{"score": "2", "method": "Project Based Learning", "details": "PBL"}, {"score": "2", "method": "Flip Classes", "details": "FLIP CLASS"}], "projects2": [{"hod": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "sanction_date": "", "project_status": ""}], "proposals": [{"hod": "", "score": "10", "title": "Research Proposal", "agency": "Maharashtra", "amount": "2000000", "director": "", "duration": "2"}], "courseFile": [{"hod": "", "score": "2", "title": "Advanced Manufacturing Processes", "course": "Course File", "details": "All checklist attached", "director": ""}, {"hod": "", "score": "2", "title": "Vehicle Dynamics", "course": "Course File", "details": "All Checklist attached", "director": ""}, {"hod": "", "score": "2", "title": "FEA", "course": "Course File`", "details": "All Checklist attached", "director": ""}], "innovScore": "4", "innovDetails": "", "externalProjects": [{"hod": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "sanction_date": "", "project_status": ""}], "internalProjects": [], "sectionSaveStatus": {"partA": true, "partB": true}, "sectionApplicability": {"projects": "applicable", "research": "applicable"}}, "status": "Pending Director Review", "totals": {"grandTotal": 249, "partATotal": 129, "partBTotal": 120}, "review_chain": ["director", "dean", "vc"], "academic_year": "2025-2026", "next_reviewer": "director", "workflow_status": "Pending Director Review", "submitter_profile": {"email": "ram.kunwer@dypiu.ac.in", "school": "SoCE — School of Continual Education", "full_name": "Dr. Ram Kunwer", "department": "", "designation": "", "employee_id": "", "appraisal_role": "faculty"}, "next_reviewer_role": "director"}	2026-05-11 12:12:53.584524+00	2026-05-11 12:12:53.58453+00
a22e5a5c-9edf-4f06-bc93-424eb1d4b11e	pravin.gorde@dypiu.ac.in	2025-2026	{"docs": {"fdp-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/fdp-0/d136f590-4b8a-4c9f-9d22-052556ffa2a6_Assignment_1.docx", "name": "Assignment 1.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/fdp-0/d136f590-4b8a-4c9f-9d22-052556ffa2a6_Assignment_1.docx"}], "ict-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ict-0/ec1cc0bf-2685-4e02-9356-1ae99323dd00_Assignment_1.docx", "name": "Assignment 1.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/ict-0/ec1cc0bf-2685-4e02-9356-1ae99323dd00_Assignment_1.docx"}], "ind-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-0/e5863e55-0b0b-4858-b6c1-183c5354492f_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "name": "ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/ind-0/e5863e55-0b0b-4858-b6c1-183c5354492f_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx"}], "innov": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov/2c471175-e66d-4e23-b19c-3a1686b9291a_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "name": "ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/innov/2c471175-e66d-4e23-b19c-3a1686b9291a_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx"}], "lec-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-0/e5d8863f-d08d-4203-8cf5-e187e335ac7a_Basic_Civil_and_Construction_Engineering_%2824-5-24%29.docx", "name": "Basic Civil and Construction Engineering (24-5-24).docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/lec-0/e5d8863f-d08d-4203-8cf5-e187e335ac7a_Basic_Civil_and_Construction_Engineering_(24-5-24).docx"}], "soc-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/soc-0/cba10799-db21-4e34-a724-2688cbc484ea_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "name": "ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/soc-0/cba10799-db21-4e34-a724-2688cbc484ea_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx"}], "soc-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/soc-1/dfc95f18-00f8-401d-9012-542082ef2187_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "name": "ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/soc-1/dfc95f18-00f8-401d-9012-542082ef2187_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx"}], "uni-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-0/58d9c8fe-5e05-4f91-90a6-adcf5d1e6f3d_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "name": "ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/uni-0/58d9c8fe-5e05-4f91-90a6-adcf5d1e6f3d_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx"}], "book-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-0/252d69de-64d8-4f98-aff7-53038c1090ae_Design%2Bof%2B3%2BAxis%2B3D%2BPrinting%2Bof%2BConcrete%2Bfinal%2B%281%29.pdf", "name": "Design+of+3+Axis+3D+Printing+of+Concrete+final+(1).pdf", "type": "application/pdf", "publicId": "faculty-appraisal/book-0/252d69de-64d8-4f98-aff7-53038c1090ae_Design+of+3+Axis+3D+Printing+of+Concrete+final+(1).pdf"}], "conf-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/conf-0/db28394b-441f-4187-ba15-36c8f80df7b6_Assignment_1.docx", "name": "Assignment 1.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/conf-0/db28394b-441f-4187-ba15-36c8f80df7b6_Assignment_1.docx"}], "dept-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/dept-0/8db0fcd5-6c82-47ad-843a-c14bfde7e937_Assignment_1.docx", "name": "Assignment 1.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/dept-0/8db0fcd5-6c82-47ad-843a-c14bfde7e937_Assignment_1.docx"}], "jour-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/jour-0/c81d3c66-3234-47ad-8ba6-fe66642139c5_Design%2Bof%2B3%2BAxis%2B3D%2BPrinting%2Bof%2BConcrete%2Bfinal%2B%281%29.pdf", "name": "Design+of+3+Axis+3D+Printing+of+Concrete+final+(1).pdf", "type": "application/pdf", "publicId": "faculty-appraisal/jour-0/c81d3c66-3234-47ad-8ba6-fe66642139c5_Design+of+3+Axis+3D+Printing+of+Concrete+final+(1).pdf"}], "proj-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-0/87a411dc-9cd6-4a07-b423-d13432a47d8e_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "name": "ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/proj-0/87a411dc-9cd6-4a07-b423-d13432a47d8e_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx"}], "proj-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-1/12bca49a-566d-4c3a-8051-3db8e5fd6950_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "name": "ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/proj-1/12bca49a-566d-4c3a-8051-3db8e5fd6950_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx"}], "proj-2": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-2/94108780-7fe0-43b1-b678-1a3cc01ddd34_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "name": "ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/proj-2/94108780-7fe0-43b1-b678-1a3cc01ddd34_ACAD-DI-10_LESSON_PLAN_BCE_PJG.docx"}], "proj-3": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/proj-3/4e227b9e-2076-4e93-b6d0-9c23cbc5e7f2_Assignment_1.docx", "name": "Assignment 1.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/proj-3/4e227b9e-2076-4e93-b6d0-9c23cbc5e7f2_Assignment_1.docx"}], "qual-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/qual-0/c332b745-380a-4bb8-9aa5-ce70c0ce9637_Basic_Civil_and_Construction_Engineering_%2824-5-24%29.docx", "name": "Basic Civil and Construction Engineering (24-5-24).docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/qual-0/c332b745-380a-4bb8-9aa5-ce70c0ce9637_Basic_Civil_and_Construction_Engineering_(24-5-24).docx"}], "qual-1": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/qual-1/38d55165-c92a-4b8a-9ee0-13b67b35123f_Assignment_1.docx", "name": "Assignment 1.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/qual-1/38d55165-c92a-4b8a-9ee0-13b67b35123f_Assignment_1.docx"}], "externalProject-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/externalProject-0/8594064b-b648-404c-afc5-eba336dd1a47_Assignment_1.docx", "name": "Assignment 1.docx", "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "publicId": "faculty-appraisal/externalProject-0/8594064b-b648-404c-afc5-eba336dd1a47_Assignment_1.docx"}]}, "form": {"acr": [{"hod": "", "label": "Self-motivation and Proactiveness", "director": ""}, {"hod": "", "label": "Punctuality", "director": ""}, {"hod": "", "label": "Target based work", "director": ""}, {"hod": "", "label": "Effectiveness", "director": ""}, {"hod": "", "label": "Obedience", "director": ""}], "ict": [{"hod": "", "type": "Quiz", "score": "20", "title": "ICT", "director": "", "quadrant": "1", "description": "Website"}, {"hod": "", "type": "", "score": "", "title": "", "director": "", "quadrant": "", "description": ""}], "fdps": [{"hod": "", "score": "5", "program": "FDP", "director": "", "duration": "5 days", "organization": "DYPIEMR"}, {"hod": "", "score": "", "program": "", "director": "", "duration": "", "organization": ""}], "info": {"ay": "2025-2026", "name": "Dr. Pravin Gorde", "qual": "", "desig": "Professor & Head", "expDyp": "", "school": "SoEMR — School of Engineering Management & Research", "expPrev": "", "expTotal": ""}, "books": [{"hod": "", "book": "Tuijin Jishu/Journal of Propulsion Technology", "issn": "ISSN: 1001-4055", "score": "20", "title": "Design and Development of 3 Axis 3D Printing of Sustainable Concrete Structures and Characterization of Affordable Housing Solutions", "coauthor": "yes", "director": "", "publisher": "scopus", "first_author": "Yes"}, {"hod": "", "book": "", "issn": "", "score": "", "title": "", "coauthor": "", "director": "", "publisher": "", "first_author": ""}], "confs": [{"hod": "", "type": "session", "level": "state", "score": "10", "title": "Resourse person", "director": "", "organization": "Adsul coe"}, {"hod": "", "type": "", "level": "", "score": "", "title": "", "director": "", "organization": ""}, {"hod": "", "type": "", "level": "", "score": "", "title": "", "director": "", "organization": ""}], "quals": [{"hod": "", "label": "Higher Qualification achieved (5 Marks)", "score": "5", "director": ""}, {"hod": "", "label": "Add-on Qualification / Certification (Max 5)", "score": "5", "director": ""}], "awards": [{"hod": "", "level": "", "score": "", "title": "", "agency": "", "director": "", "award_date": ""}, {"hod": "", "level": "", "score": "", "title": "", "agency": "", "director": "", "award_date": ""}], "patents": [{"hod": "", "type": "", "score": "", "title": "", "file_no": "", "director": "", "patent_date": "", "patent_status": ""}, {"hod": "", "type": "", "score": "", "title": "", "file_no": "", "director": "", "patent_date": "", "patent_status": ""}], "society": [{"hod": "", "score": "5", "details": "FY", "activity": "Induction Program", "director": "", "participated": "Yes"}, {"hod": "", "score": "5", "details": "SY", "activity": "Unnat Bharat Abhiyan", "director": "", "participated": "Yes"}], "uniActs": [{"hod": "", "score": "30", "nature": "2 semester", "activity": "HOD", "director": ""}, {"hod": "", "score": "", "nature": "", "activity": "", "director": ""}, {"hod": "", "score": "", "nature": "", "activity": "", "director": ""}], "deptActs": [{"hod": "", "score": "20", "nature": "full year", "activity": "HOD", "director": ""}, {"hod": "", "score": "", "nature": "", "activity": "", "director": ""}, {"hod": "", "score": "", "nature": "", "activity": "", "director": ""}], "feedback": [{"hod": "", "score": "0.8", "director": "", "feedback_1": "8", "feedback_2": "8", "course_code": "FY"}], "industry": [{"hod": "", "name": "Ultratech", "score": "5", "details": "MOU", "director": ""}], "journals": [{"hod": "", "issn": "ISSN: 1001-4055", "score": "30", "title": "Design and Development of 3 Axis 3D Printing of Sustainable Concrete Structures and Characterization of Affordable Housing Solutions", "journal": "Tuijin Jishu/Journal of Propulsion Technology", "director": "", "indexing": "scopus"}, {"hod": "", "issn": "", "score": "", "title": "", "journal": "", "director": "", "indexing": ""}, {"hod": "", "issn": "", "score": "", "title": "", "journal": "", "director": "", "indexing": ""}], "lectures": [{"hod": "", "score": "50", "director": "", "semester": "I", "course_code": "BCCE", "planned_classes": "35", "conducted_classes": "35"}], "products": [{"hod": "", "score": "", "usage": "", "details": "", "director": ""}, {"hod": "", "score": "", "usage": "", "details": "", "director": ""}], "projects": [{"hod": "", "label": "Project guided (3/batch)", "score": "3", "director": ""}, {"hod": "", "label": "Industrial collaboration / Sponsorship (Max 5)", "score": "2", "director": ""}, {"hod": "", "label": "Award received (Max 5 marks)", "score": "3", "director": ""}, {"hod": "", "label": "Project outcome: events/publications (Max 5)", "score": "2", "director": ""}], "research": [{"hod": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}, {"hod": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}], "training": [{"hod": "", "score": "", "nature": "", "company": "", "director": "", "duration": ""}, {"hod": "", "score": "", "nature": "", "company": "", "director": "", "duration": ""}], "projects2": [{"hod": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "sanction_date": "", "project_status": ""}, {"hod": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "sanction_date": "", "project_status": ""}], "proposals": [{"hod": "", "score": "", "title": "", "agency": "", "amount": "", "director": "", "duration": ""}, {"hod": "", "score": "", "title": "", "agency": "", "amount": "", "director": "", "duration": ""}], "courseFile": [{"hod": "", "score": "", "title": "FY", "course": "BCCE", "details": "1.Available", "director": ""}], "innovScore": "10", "innovDetails": "Blended Learning, Virtual Lab, LMS, Project Based Learning, Flip Classroom", "externalProjects": [{"hod": "", "role": "PI", "score": "20", "title": "Consultancy", "agency": "other", "amount": "45000", "sanction_date": "22/04/2026", "project_status": "completed"}, {"hod": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "sanction_date": "", "project_status": ""}], "internalProjects": [], "sectionSaveStatus": {"partA": true, "partB": true}, "sectionApplicability": {"projects": "applicable", "research": "notApplicable"}}, "status": "Pending Director Review", "totals": {"grandTotal": 250.8, "partATotal": 145.8, "partBTotal": 105}, "review_chain": ["director", "dean", "vc"], "academic_year": "2025-2026", "next_reviewer": "director", "workflow_status": "Pending Director Review", "submitter_profile": {"email": "pravin.gorde@dypiu.ac.in", "school": "SoEMR — School of Engineering Management & Research", "full_name": "Dr. Pravin Gorde", "department": "Civil Engineering", "designation": "", "employee_id": "", "appraisal_role": "hod"}, "next_reviewer_role": "director"}	2026-05-11 13:14:03.606267+00	2026-05-11 13:14:03.606276+00
a295c05f-5221-474c-a75e-e6dfe2348824	samarthgangji2405@gmail.com	2025-2026	{"docs": {"awd-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/awd-0/e86dd092-91a4-40cd-8465-c7215cb6616d_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/awd-0/e86dd092-91a4-40cd-8465-c7215cb6616d_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "fdp-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/fdp-0/139c93c8-9244-4f3e-917c-48e75f92f4c3_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/fdp-0/139c93c8-9244-4f3e-917c-48e75f92f4c3_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "ict-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ict-0/ccd8760d-fa73-406f-83f6-63dd498de8cf_final_backend_endpoints.pdf", "name": "final backend endpoints.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/ict-0/ccd8760d-fa73-406f-83f6-63dd498de8cf_final_backend_endpoints.pdf"}], "ind-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-0/fc67d35c-9e45-41ee-8ec1-fba4bb60059d_api.pdf", "name": "api.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/ind-0/fc67d35c-9e45-41ee-8ec1-fba4bb60059d_api.pdf"}], "lec-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-0/55d25c55-e0cf-4317-9c61-350734cf84b3_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/lec-0/55d25c55-e0cf-4317-9c61-350734cf84b3_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "pat-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/pat-0/af0be3df-e533-4fa4-aba5-bdefec81c2eb_final_backend_endpoints.pdf", "name": "final backend endpoints.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/pat-0/af0be3df-e533-4fa4-aba5-bdefec81c2eb_final_backend_endpoints.pdf"}], "soc-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/soc-0/bff7d444-2ace-408d-ad7a-c3339abf5499_api.pdf", "name": "api.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/soc-0/bff7d444-2ace-408d-ad7a-c3339abf5499_api.pdf"}], "uni-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-0/017d43b7-0d65-47dc-a9c7-8ee751dfa3a5_api.pdf", "name": "api.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/uni-0/017d43b7-0d65-47dc-a9c7-8ee751dfa3a5_api.pdf"}], "book-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-0/57967449-ef00-4b46-80da-a1b82f1dc1b0_final_backend_endpoints.pdf", "name": "final backend endpoints.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/book-0/57967449-ef00-4b46-80da-a1b82f1dc1b0_final_backend_endpoints.pdf"}], "conf-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/conf-0/74b31daa-0379-42e1-b563-e9b3a4ba10fa_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/conf-0/74b31daa-0379-42e1-b563-e9b3a4ba10fa_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "dept-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/dept-0/ab751f45-028f-4802-b7d0-999d12cf8bfd_api.pdf", "name": "api.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/dept-0/ab751f45-028f-4802-b7d0-999d12cf8bfd_api.pdf"}], "jour-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/jour-0/69977a45-59e4-4a15-bc3e-4bd5cd64472a_final_backend_endpoints.pdf", "name": "final backend endpoints.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/jour-0/69977a45-59e4-4a15-bc3e-4bd5cd64472a_final_backend_endpoints.pdf"}], "prod-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prod-0/529d9951-faa6-436a-9177-2852b42d16c5_api.pdf", "name": "api.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/prod-0/529d9951-faa6-436a-9177-2852b42d16c5_api.pdf"}], "prop-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prop-0/d76d72d8-0ba4-4f0e-b8eb-f16f4905da23_final_backend_endpoints.pdf", "name": "final backend endpoints.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/prop-0/d76d72d8-0ba4-4f0e-b8eb-f16f4905da23_final_backend_endpoints.pdf"}], "qual-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/qual-0/f51c5232-81ee-40e6-93c0-f60c59746363_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/qual-0/f51c5232-81ee-40e6-93c0-f60c59746363_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "innov-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-0/c25a627d-6a86-4816-a676-534966406180_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/innov-0/c25a627d-6a86-4816-a676-534966406180_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "train-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/train-0/a4fd2cf0-e2ef-405a-9b75-e232fc632057_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/train-0/a4fd2cf0-e2ef-405a-9b75-e232fc632057_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "project2-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/project2-0/29da30a0-57fc-4c65-8325-e0627853a6ed_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/project2-0/29da30a0-57fc-4c65-8325-e0627853a6ed_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "externalProject-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/externalProject-0/8bc7b371-5cef-4d4b-aee7-8e79e583c17e_final_backend_endpoints.pdf", "name": "final backend endpoints.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/externalProject-0/8bc7b371-5cef-4d4b-aee7-8e79e583c17e_final_backend_endpoints.pdf"}]}, "form": {"acr": [{"hod": "", "label": "Self-motivation and Proactiveness", "score": "", "director": ""}, {"label": "Punctuality"}, {"label": "Target based work"}, {"label": "Effectiveness"}, {"label": "Obedience"}], "ict": [{"hod": "", "type": "aaa", "score": "3", "title": "a", "director": "", "quadrant": "a", "description": "a"}], "fdps": [{"hod": "", "score": "3", "program": "a", "director": "", "duration": "a", "organization": "aa"}], "info": {"ay": "2025-2026", "name": "Faculty_Testing", "qual": "", "desig": "Assistant Professor", "expDyp": "", "school": "SoBB — School of Bio-Engineering & Bio Science", "expPrev": "", "expTotal": ""}, "books": [{"hod": "", "book": "a", "issn": "a", "score": "3", "title": "a", "coauthor": "a", "director": "", "publisher": "a", "first_author": "Yes"}], "confs": [{"hod": "", "type": "a", "level": "a", "score": "30", "title": "a", "director": "", "organization": "a"}], "quals": [{"hod": "", "label": "a", "score": "2", "director": ""}], "awards": [{"hod": "", "level": "a", "score": "3", "title": "a", "agency": "a", "director": "", "award_date": "10/10/1010"}], "patents": [{"hod": "", "type": "aa", "score": "3", "title": "a", "file_no": "a", "director": "", "patent_date": "10/10/1010", "patent_status": "a"}], "society": [{"hod": "", "score": "3", "details": "a", "activity": "a", "director": "", "participated": "Yes"}], "uniActs": [{"hod": "", "score": "3", "nature": "a", "activity": "a", "director": ""}], "deptActs": [{"hod": "", "score": "3", "nature": "a", "activity": "a", "director": ""}], "feedback": [{"hod": "", "score": "5.6", "director": "", "feedback_1": "56", "feedback_2": "56", "course_code": "a"}], "industry": [{"hod": "", "name": "a", "score": "3", "details": "a", "director": ""}], "journals": [{"hod": "", "issn": "a", "score": "3", "title": "a", "journal": "a", "director": "", "indexing": "a"}], "lectures": [{"hod": "", "score": "2", "director": "", "semester": "a", "course_code": "a", "planned_classes": "2", "conducted_classes": "2"}], "products": [{"hod": "", "score": "30", "usage": "a", "details": "a", "director": ""}], "projects": [{"hod": "", "label": "", "score": "", "director": ""}], "research": [{"hod": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}], "training": [{"hod": "", "score": "3", "nature": "a", "company": "a", "director": "", "duration": "aa"}], "innovRows": [{"score": "2", "method": "a", "details": "a"}], "projects2": [{"hod": "", "role": "a", "score": "3", "title": "a", "agency": "a", "amount": "100000", "sanction_date": "10/10/1010", "project_status": "a"}], "proposals": [{"hod": "", "score": "3", "title": "a", "agency": "a", "amount": "10000", "director": "", "duration": "a"}], "courseFile": [{"hod": "", "score": "3", "title": "24", "course": "a", "details": "1.Available", "director": ""}], "innovScore": "2", "innovDetails": "", "externalProjects": [{"hod": "", "role": "a", "score": "3", "title": "a", "agency": "a", "amount": "100000", "sanction_date": "10/10/1010", "project_status": "a"}], "internalProjects": [], "sectionSaveStatus": {"partA": true, "partB": true}, "sectionApplicability": {"projects": "notApplicable", "research": "notApplicable"}}, "status": "Pending Director Review", "totals": {"grandTotal": 96.6, "partATotal": 26.6, "partBTotal": 70}, "review_chain": ["director", "dean", "vc"], "academic_year": "2025-2026", "next_reviewer": "director", "workflow_status": "Pending Director Review", "submitter_profile": {"email": "samarthgangji2405@gmail.com", "school": "SoBB — School of Bio-Engineering & Bio Science", "full_name": "Faculty_Testing", "department": "", "designation": "Assistant Professor", "employee_id": "E6", "appraisal_role": "faculty"}, "next_reviewer_role": "director"}	2026-05-12 04:49:02.153998+00	2026-05-12 04:49:02.154003+00
bcf6d5b4-412c-4cd7-b320-7defc2de1928	providence2405@gmail.com	2025-2026	{"docs": {"awd-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/awd-0/9954f87d-56ca-489c-83f7-e386a79f5d1c_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/awd-0/9954f87d-56ca-489c-83f7-e386a79f5d1c_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "fdp-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/fdp-0/e03c029c-1f61-4581-8cda-65f7183dc5ac_final_backend_endpoints.pdf", "name": "final backend endpoints.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/fdp-0/e03c029c-1f61-4581-8cda-65f7183dc5ac_final_backend_endpoints.pdf"}], "ict-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ict-0/45d1c3d9-7cfa-4a81-890b-728936fc3c8c_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/ict-0/45d1c3d9-7cfa-4a81-890b-728936fc3c8c_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "ind-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/ind-0/0ac4060c-aa59-48a4-8a15-014e8105aeb9_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/ind-0/0ac4060c-aa59-48a4-8a15-014e8105aeb9_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "lec-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/lec-0/ad229228-9004-4d57-b6f7-30c96002c8bd_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/lec-0/ad229228-9004-4d57-b6f7-30c96002c8bd_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "pat-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/pat-0/9982a3f7-bd1b-4ab8-860a-8b818f415843_final_backend_endpoints.pdf", "name": "final backend endpoints.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/pat-0/9982a3f7-bd1b-4ab8-860a-8b818f415843_final_backend_endpoints.pdf"}], "uni-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/uni-0/6e47c3c5-c84b-4c0c-b16c-854c81fb50fd_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/uni-0/6e47c3c5-c84b-4c0c-b16c-854c81fb50fd_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "book-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/book-0/dd832b41-448d-43da-b219-4ea878a7407c_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/book-0/dd832b41-448d-43da-b219-4ea878a7407c_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "conf-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/conf-0/e67493bc-4b60-4877-90aa-64ba2d8374ea_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/conf-0/e67493bc-4b60-4877-90aa-64ba2d8374ea_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "dept-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/dept-0/9febe6a1-16da-4a99-9463-c488304ed700_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/dept-0/9febe6a1-16da-4a99-9463-c488304ed700_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "jour-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/jour-0/4e3111ff-05dc-4360-b91a-46d7f98bcf8a_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/jour-0/4e3111ff-05dc-4360-b91a-46d7f98bcf8a_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "prod-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prod-0/bcab84be-de05-498c-8afb-c0ec1c62cc68_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/prod-0/bcab84be-de05-498c-8afb-c0ec1c62cc68_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "prop-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/prop-0/3849fcb8-22a6-4fe2-8917-9c8c85eed9e4_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/prop-0/3849fcb8-22a6-4fe2-8917-9c8c85eed9e4_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}], "qual-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/qual-0/1dcfd364-e5c2-4e43-9739-a961367b5074_final_backend_endpoints.pdf", "name": "final backend endpoints.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/qual-0/1dcfd364-e5c2-4e43-9739-a961367b5074_final_backend_endpoints.pdf"}], "innov-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/innov-0/71198323-48a0-4d2e-a152-b37bb234a765_final_backend_endpoints.pdf", "name": "final backend endpoints.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/innov-0/71198323-48a0-4d2e-a152-b37bb234a765_final_backend_endpoints.pdf"}], "train-0": [{"url": "https://storage.googleapis.com/faculty-appraisal-uploads/faculty-appraisal/train-0/349daa54-1893-4d99-93dc-5290090e1fad_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "name": "15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf", "type": "application/pdf", "publicId": "faculty-appraisal/train-0/349daa54-1893-4d99-93dc-5290090e1fad_15f393b4-6ed8-48f3-a2cf-5c7aea632eb5.pdf"}]}, "form": {"acr": [{"label": "Self-motivation and Proactiveness"}, {"label": "Punctuality"}, {"label": "Target based work"}, {"label": "Effectiveness"}, {"label": "Obedience"}], "ict": [{"hod": "", "type": "a", "score": "20", "title": "a", "director": "", "quadrant": "a", "description": "a"}], "fdps": [{"hod": "", "score": "5", "program": "a", "director": "", "duration": "aa", "organization": "a"}], "info": {"ay": "2025-2026", "name": "f_test", "qual": "", "desig": "Assistant Professor", "expDyp": "", "school": "SoBB — School of Bio-Engineering & Bio Science", "expPrev": "", "expTotal": ""}, "books": [{"hod": "", "book": "a", "issn": "a", "score": "50", "title": "a", "coauthor": "a", "director": "", "publisher": "a", "first_author": "No"}], "confs": [{"hod": "", "type": "a", "level": "a", "score": "30", "title": "a", "director": "", "organization": "a"}], "quals": [{"hod": "", "label": "a", "score": "5", "director": ""}], "awards": [{"hod": "", "level": "a", "score": "10", "title": "a", "agency": "a", "director": "", "award_date": "10/10/2000"}], "patents": [{"hod": "", "type": "a", "score": "40", "title": "a", "file_no": "a", "director": "", "patent_date": "20/10/2020", "patent_status": "a"}], "society": [{"hod": "", "score": "0", "details": "", "activity": "", "director": "", "participated": ""}], "uniActs": [{"hod": "", "score": "30", "nature": "a", "activity": "a", "director": ""}], "deptActs": [{"hod": "", "score": "20", "nature": "a", "activity": "a", "director": ""}], "feedback": [{"hod": "", "score": "9.2", "director": "", "feedback_1": "96", "feedback_2": "87", "course_code": "a"}], "industry": [{"hod": "", "name": "a", "score": "5", "details": "a", "director": ""}], "journals": [{"hod": "", "issn": "a", "score": "100", "title": "a", "journal": "a", "director": "", "indexing": "a"}], "lectures": [{"hod": "", "score": "50", "director": "", "semester": "a", "course_code": "a", "planned_classes": "30", "conducted_classes": "30"}], "products": [{"hod": "", "score": "10", "usage": "a", "details": "a", "director": ""}], "projects": [{"hod": "", "label": "", "score": "", "director": ""}], "research": [{"hod": "", "score": "", "degree": "", "thesis": "", "director": "", "student_name": ""}], "training": [{"hod": "", "score": "5", "nature": "a", "company": "a", "director": "", "duration": "a"}], "innovRows": [{"score": "2", "method": "a", "details": "a"}], "projects2": [{"hod": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "sanction_date": "", "project_status": ""}], "proposals": [{"hod": "", "score": "10", "title": "a", "agency": "a", "amount": "10000", "director": "", "duration": "a"}], "courseFile": [{"hod": "", "score": "20", "title": "2020", "course": "a", "details": "1.Available", "director": ""}], "innovScore": "2", "innovDetails": "", "externalProjects": [{"hod": "", "role": "", "score": "", "title": "", "agency": "", "amount": "", "sanction_date": "", "project_status": ""}], "internalProjects": [], "sectionSaveStatus": {"partA": true, "partB": true}, "sectionApplicability": {"projects": "notApplicable", "research": "notApplicable"}}, "status": "Pending Director Review", "totals": {"grandTotal": 421.15, "partATotal": 141.15, "partBTotal": 280}, "review_chain": ["director", "dean", "vc"], "academic_year": "2025-2026", "next_reviewer": "director", "workflow_status": "Pending Director Review", "submitter_profile": {"email": "providence2405@gmail.com", "school": "SoBB — School of Bio-Engineering & Bio Science", "full_name": "f_test", "department": "", "designation": "Assistant Professor", "employee_id": "45", "appraisal_role": "faculty"}, "next_reviewer_role": "director"}	2026-05-12 05:28:21.288839+00	2026-05-12 05:28:21.288843+00
\.


--
-- Data for Name: awards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.awards (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, title, award_date, agency, level, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
5b5f882d-04d7-4eec-bd1d-b4bf12fa9463	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B5(b). Awards	\N	1	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.071851+00	2026-05-11 11:40:49.071856+00
bb46f822-e167-42c5-96cf-e70fa62f7469	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B5(b). Awards	\N	2	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.071866+00	2026-05-11 11:40:49.071867+00
e388caeb-0049-4e91-9c10-79d6b213fe2e	pravin.gorde@dypiu.ac.in	2025-2026	standard	B5(b). Awards	\N	1	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.506028+00	2026-05-11 13:14:03.506032+00
44faa333-ab9f-4624-bd15-a19233baf8c7	pravin.gorde@dypiu.ac.in	2025-2026	standard	B5(b). Awards	\N	2	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.50604+00	2026-05-11 13:14:03.506042+00
4cfa1c96-b0e1-4b80-ada9-9fc42bf7cf13	samarthgangji2405@gmail.com	2025-2026	standard	B5(b). Awards	\N	1	a	1010-10-10	a	a	3	\N	\N	\N	\N	2026-05-12 04:49:02.086157+00	2026-05-12 04:49:02.086162+00
551688c3-f03d-4967-89b3-7681a83ced38	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B5(b). Awards	\N	1	\N	\N	\N	\N	0	0	0	0	\N	2026-05-11 11:51:53.764109+00	2026-05-12 04:56:59.745212+00
1cf9f1de-b748-4c72-a378-68c330ad3c69	ram.kunwer@dypiu.ac.in	2025-2026	standard	B5(b). Awards	\N	1	\N	\N	\N	\N	0	\N	0	0	\N	2026-05-11 12:12:53.470249+00	2026-05-12 04:59:00.486352+00
73460ee8-747f-430b-8d08-8375afa8caa6	providence2405@gmail.com	2025-2026	standard	B5(b). Awards	\N	1	a	2000-10-10	a	a	10	\N	10	\N	\N	2026-05-12 05:28:21.177776+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: book_publications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.book_publications (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, title, book, issn, isbn, publisher, coauthor, first_author, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
341500c8-3569-4433-8ad9-327cad18bd5f	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B2. Books / Book Chapters	\N	1	book chapter	abcdd	2014	\N	national	no	Yes	20	\N	\N	\N	\N	2026-05-11 11:40:49.078455+00	2026-05-11 11:40:49.07846+00
877f3167-388f-4b96-88cd-1f03fdb3b3c5	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B2. Books / Book Chapters	\N	2	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.084114+00	2026-05-11 11:40:49.084131+00
29f41816-0375-4e29-9dea-0301acaeef81	pravin.gorde@dypiu.ac.in	2025-2026	standard	B2. Books / Book Chapters	\N	1	Design and Development of 3 Axis 3D Printing of Sustainable Concrete Structures and Characterization of Affordable Housing Solutions	Tuijin Jishu/Journal of Propulsion Technology	ISSN: 1001-4055	\N	scopus	yes	Yes	20	\N	\N	\N	\N	2026-05-11 13:14:03.511039+00	2026-05-11 13:14:03.511043+00
0f60202f-4922-4214-8d5d-54ec842205d3	pravin.gorde@dypiu.ac.in	2025-2026	standard	B2. Books / Book Chapters	\N	2	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.515395+00	2026-05-11 13:14:03.515399+00
297bb3ec-bba8-48a7-96bb-bfc72941287b	samarthgangji2405@gmail.com	2025-2026	standard	B2. Books / Book Chapters	\N	1	a	a	a	\N	a	a	Yes	3	\N	\N	\N	\N	2026-05-12 04:49:02.089287+00	2026-05-12 04:49:02.089294+00
b32b4d3b-97c1-41c0-892c-9e6c9fb40ff2	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B2. Books / Book Chapters	\N	1	Book Chapter 1	THM	1234 1232	\N	International	No	No	10	20	20	20	\N	2026-05-11 11:51:53.770129+00	2026-05-12 04:56:59.745212+00
6a93a396-8756-41f9-a966-cf478a063dee	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B2. Books / Book Chapters	\N	2	Book Chapter 2	ABC	1122 3344	\N	International	No	No	10	20	20	20	\N	2026-05-11 11:51:53.770144+00	2026-05-12 04:56:59.745212+00
553a2844-bd70-4987-b14f-e7f62760571c	ram.kunwer@dypiu.ac.in	2025-2026	standard	B2. Books / Book Chapters	\N	1	Book Chapter 1	Springer	9832e784	\N	Research	1	Yes	20	\N	10	20	\N	2026-05-11 12:12:53.47692+00	2026-05-12 04:59:00.486352+00
7893de1c-ee82-4327-9530-02b3e900ad69	ram.kunwer@dypiu.ac.in	2025-2026	standard	B2. Books / Book Chapters	\N	2	\N	\N	\N	\N	\N	\N	\N	0	\N	10	20	\N	2026-05-11 12:12:53.48243+00	2026-05-12 04:59:00.486352+00
0e0cc670-9ea0-4fd9-90a6-99073a0d2f85	providence2405@gmail.com	2025-2026	standard	B2. Books / Book Chapters	\N	1	a	a	a	\N	a	a	No	50	\N	50	\N	\N	2026-05-12 05:28:21.183238+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: conferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conferences (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, title, type, organization, level, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
c48cc0f0-3cd9-4453-952c-cea61c50f086	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B6. Invited Lectures / Resource Person / Paper Presentations	\N	1	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.088304+00	2026-05-11 11:40:49.088309+00
943735f0-8e34-49da-a75e-2da359f47ecb	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B6. Invited Lectures / Resource Person / Paper Presentations	\N	2	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.088318+00	2026-05-11 11:40:49.08832+00
893100f0-67a2-4dc5-82a3-3e7a50408b5a	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B6. Invited Lectures / Resource Person / Paper Presentations	\N	3	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.088326+00	2026-05-11 11:40:49.088328+00
b1ed61eb-a61e-4bdd-8a2b-4a326dfa5a69	pravin.gorde@dypiu.ac.in	2025-2026	standard	B6. Invited Lectures / Resource Person / Paper Presentations	\N	1	Resourse person	session	Adsul coe	state	10	\N	\N	\N	\N	2026-05-11 13:14:03.517815+00	2026-05-11 13:14:03.51782+00
b39f0f04-9cb0-4fbb-a85f-9434157cc037	pravin.gorde@dypiu.ac.in	2025-2026	standard	B6. Invited Lectures / Resource Person / Paper Presentations	\N	2	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.520134+00	2026-05-11 13:14:03.520138+00
917fd757-8647-49fa-97de-7d663a10f86f	pravin.gorde@dypiu.ac.in	2025-2026	standard	B6. Invited Lectures / Resource Person / Paper Presentations	\N	3	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.520147+00	2026-05-11 13:14:03.520148+00
dd05ce45-33b3-4b73-bd22-30e6fa780262	samarthgangji2405@gmail.com	2025-2026	standard	B6. Invited Lectures / Resource Person / Paper Presentations	\N	1	a	a	a	a	30	\N	\N	\N	\N	2026-05-12 04:49:02.09241+00	2026-05-12 04:49:02.092414+00
45737dc7-6f39-421c-ae09-f8d95a79b75d	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B6. Invited Lectures / Resource Person / Paper Presentations	\N	1	\N	\N	\N	\N	0	0	0	0	\N	2026-05-11 11:51:53.776082+00	2026-05-12 04:56:59.745212+00
d02ad2ea-5026-4ae9-862a-4334a9450c6f	ram.kunwer@dypiu.ac.in	2025-2026	standard	B6. Invited Lectures / Resource Person / Paper Presentations	\N	1	CFD	Symposium	SYNOPSIS	NA	30	\N	0	30	\N	2026-05-11 12:12:53.486109+00	2026-05-12 04:59:00.486352+00
0219a03e-1fc5-4c2a-b785-28c9b719f4ec	providence2405@gmail.com	2025-2026	standard	B6. Invited Lectures / Resource Person / Paper Presentations	\N	1	a	a	a	a	30	\N	30	\N	\N	2026-05-12 05:28:21.188345+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: course_files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course_files (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, course, title, details, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
75fa8b5a-8bdc-4e7e-9a09-5b9952e1ccef	tejashri.gulve@dypiu.ac.in	2025-2026	standard	A2. Course File	\N	1	SY	Structural Analysis	\N	2	\N	\N	\N	\N	2026-05-11 11:40:48.970586+00	2026-05-11 12:20:05.394844+00
bee50cf6-d693-453b-8504-713ea5b7f889	pravin.gorde@dypiu.ac.in	2025-2026	standard	A2. Course File	\N	1	BCCE	FY	1.Available	0	\N	\N	\N	\N	2026-05-11 13:14:03.459472+00	2026-05-11 13:14:03.459477+00
62aa4363-7826-4aa6-b031-e2edf43d878c	samarthgangji2405@gmail.com	2025-2026	standard	A2. Course File	\N	1	a	24	1.Available	3	\N	\N	\N	\N	2026-05-12 04:49:02.046248+00	2026-05-12 04:49:02.046254+00
e0b85627-44a2-4d10-bb2e-02646aeb3473	sunil.dambhare@dypiu.ac.in	2025-2026	standard	A2. Course File	\N	1	Fluid Mechanics	SY B Tech	\N	2	4	4	4	\N	2026-05-11 11:51:53.692972+00	2026-05-12 04:56:59.745212+00
24b72d23-c7e6-4dbd-9a0c-b43f6341c3da	sunil.dambhare@dypiu.ac.in	2025-2026	standard	A2. Course File	\N	2	Fluid Mechanics	SY B Tech	\N	2	4	4	4	\N	2026-05-11 11:51:53.693026+00	2026-05-12 04:56:59.745212+00
d9452115-bd15-43cd-8ac7-0a1833580138	ram.kunwer@dypiu.ac.in	2025-2026	standard	A2. Course File	\N	1	Course File	Advanced Manufacturing Processes	\N	2	\N	6	6	\N	2026-05-11 12:12:53.407342+00	2026-05-12 04:59:00.486352+00
94d8a956-a774-4f8e-8101-079de92a643d	ram.kunwer@dypiu.ac.in	2025-2026	standard	A2. Course File	\N	2	Course File	Vehicle Dynamics	\N	2	\N	6	6	\N	2026-05-11 12:12:53.407358+00	2026-05-12 04:59:00.486352+00
4572689d-be0e-4328-a66d-e78370b107a0	ram.kunwer@dypiu.ac.in	2025-2026	standard	A2. Course File	\N	3	Course File`	FEA	\N	2	\N	6	6	\N	2026-05-11 12:12:53.407371+00	2026-05-12 04:59:00.486352+00
05256f64-5d29-4627-8e43-1887a4eaa80c	providence2405@gmail.com	2025-2026	standard	A2. Course File	\N	1	a	2020	1.Available	20	\N	20	\N	\N	2026-05-12 05:28:21.123238+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: declarations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.declarations (id, faculty_email, academic_year, part_a_total, part_b_total, grand_total, status, submitted_at, created_at, updated_at) FROM stdin;
3130e4f6-8cc1-4f01-8bc8-e9b2a5d48ae5	tejashri.gulve@dypiu.ac.in	2025-2026	109	45	154	Pending HOD Review	2026-05-11 11:40:49.19968+00	2026-05-11 11:40:49.199685+00	2026-05-11 11:40:49.199687+00
aa1dafe0-8fdc-477a-83cd-d7bcdd90a32f	pravin.gorde@dypiu.ac.in	2025-2026	145.80000000000001136868377216160297393798828125	105	250.80000000000001136868377216160297393798828125	Pending Director Review	2026-05-11 13:14:03.609814+00	2026-05-11 13:14:03.609818+00	2026-05-11 13:14:03.60982+00
48c37fb9-1f4d-4a13-bf3d-88a534f37fbd	samarthgangji2405@gmail.com	2025-2026	26.60000000000000142108547152020037174224853515625	70	96.599999999999994315658113919198513031005859375	Pending Director Review	2026-05-12 04:49:02.157345+00	2026-05-12 04:49:02.15735+00	2026-05-12 04:49:02.157352+00
eedf7044-bff1-40e3-8824-3b4f2f94c815	sunil.dambhare@dypiu.ac.in	2025-2026	128.17500000000001136868377216160297393798828125	145	273.17500000000001136868377216160297393798828125	Pending VC Review	2026-05-11 11:51:53.877671+00	2026-05-11 11:51:53.877676+00	2026-05-12 04:56:59.745212+00
15ed0c00-8ba2-4e9e-9dc9-b0fc3238d2fd	ram.kunwer@dypiu.ac.in	2025-2026	129	120	249	Pending VC Review	2026-05-11 12:12:53.590494+00	2026-05-11 12:12:53.590499+00	2026-05-12 04:59:00.486352+00
67021d10-4c54-4bed-ad9d-ec51e9b360f7	providence2405@gmail.com	2025-2026	141.150000000000005684341886080801486968994140625	280	421.1499999999999772626324556767940521240234375	Pending Dean Review	2026-05-12 05:28:21.294497+00	2026-05-12 05:28:21.294501+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: department_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.department_activities (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, activity, nature, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
238ba733-6b73-44ac-b6ab-ad70e9fb3bd7	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Departmental / School Activities	\N	1	Guest Lecture	Co Curricular	20	\N	\N	\N	\N	2026-05-11 11:40:48.976999+00	2026-05-11 11:40:48.977004+00
7d69b877-b115-4e75-98fc-7fc2038c26b6	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Departmental / School Activities	\N	2	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:48.982391+00	2026-05-11 11:40:48.982397+00
43bd5bdf-4674-41e6-b244-be456276e91c	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Departmental / School Activities	\N	3	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:48.982409+00	2026-05-11 11:40:48.982411+00
95a31fc4-d9e4-4e19-9102-52ac75fda8df	pravin.gorde@dypiu.ac.in	2025-2026	standard	Departmental / School Activities	\N	1	HOD	full year	20	\N	\N	\N	\N	2026-05-11 13:14:03.464178+00	2026-05-11 13:14:03.464182+00
218a3f77-706c-4dd4-9d42-0a336b8e11c2	pravin.gorde@dypiu.ac.in	2025-2026	standard	Departmental / School Activities	\N	2	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.466987+00	2026-05-11 13:14:03.466992+00
724535e7-19cd-44f9-a781-89814945eb2e	pravin.gorde@dypiu.ac.in	2025-2026	standard	Departmental / School Activities	\N	3	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.467001+00	2026-05-11 13:14:03.467003+00
ce2c9d85-804c-4c7e-b72a-ec6637bf3845	samarthgangji2405@gmail.com	2025-2026	standard	Departmental / School Activities	\N	1	a	a	3	\N	\N	\N	\N	2026-05-12 04:49:02.051689+00	2026-05-12 04:49:02.051696+00
6c6a20a6-e5f6-46f8-8987-e5f52772a1ce	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Departmental / School Activities	\N	1	SAE BAJA	Year Long	20	20	20	20	\N	2026-05-11 11:51:53.698026+00	2026-05-12 04:56:59.745212+00
c17b0161-dfac-41a1-a76a-2fc896aa0e5a	ram.kunwer@dypiu.ac.in	2025-2026	standard	Departmental / School Activities	\N	1	Program Booklet	M. Tech Smart Manufacturing	20	\N	20	20	\N	2026-05-11 12:12:53.413196+00	2026-05-12 04:59:00.486352+00
5986ebd7-a73e-4092-91f7-957237906586	providence2405@gmail.com	2025-2026	standard	Departmental / School Activities	\N	1	a	a	20	\N	20	\N	\N	2026-05-12 05:28:21.12839+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: external_research_projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_research_projects (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, title, agency, sanction_date, amount, role, project_status, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
2bfc58dc-cc63-4179-b425-3036d9ae7378	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B4(c). Research / Consultancy External Projects	\N	1	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.094985+00	2026-05-11 11:40:49.09499+00
44c7f42e-3f76-461f-9875-9a7b37556959	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B4(c). Research / Consultancy External Projects	\N	2	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.095004+00	2026-05-11 11:40:49.095005+00
343838de-c99c-4312-9ae3-8c359ef1c5b2	pravin.gorde@dypiu.ac.in	2025-2026	standard	B4(c). Research / Consultancy External Projects	\N	1	Consultancy	other	2026-04-22	45000	PI	completed	20	\N	\N	\N	\N	2026-05-11 13:14:03.526032+00	2026-05-11 13:14:03.526037+00
1b5b446c-5665-40eb-ab1d-61ac4aab6b0f	pravin.gorde@dypiu.ac.in	2025-2026	standard	B4(c). Research / Consultancy External Projects	\N	2	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.530591+00	2026-05-11 13:14:03.530595+00
e5e8125e-cfd0-4f35-ae3c-a98e673d6f74	samarthgangji2405@gmail.com	2025-2026	standard	B4(c). Research / Consultancy External Projects	\N	1	a	a	1010-10-10	100000	a	a	3	\N	\N	\N	\N	2026-05-12 04:49:02.095246+00	2026-05-12 04:49:02.095251+00
2b5f3796-1727-45fe-8ad0-a13a7612fba1	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B4(c). Research / Consultancy External Projects	\N	1	Consultancy	GTech	2026-02-15	205000	Co-PI	Completed	10	15	15	13	\N	2026-05-11 11:51:53.781777+00	2026-05-12 04:56:59.745212+00
557cc08b-c8c2-4c7a-9eb5-12866620d0af	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B4(c). Research / Consultancy External Projects	\N	2	Consultancy	Fabritek	2026-01-10	100000	CO-PI	Completed	5	15	15	13	\N	2026-05-11 11:51:53.78179+00	2026-05-12 04:56:59.745212+00
697ee1e5-2b62-4163-80b7-fa5234014e61	ram.kunwer@dypiu.ac.in	2025-2026	standard	B4(c). Research / Consultancy External Projects	\N	1	\N	\N	\N	\N	\N	\N	0	\N	0	0	\N	2026-05-11 12:12:53.49258+00	2026-05-12 04:59:00.486352+00
7e41f753-e408-4087-9bf3-66ca0469ca93	providence2405@gmail.com	2025-2026	standard	B4(c). Research / Consultancy External Projects	\N	1	\N	\N	\N	\N	\N	\N	0	\N	0	\N	\N	2026-05-12 05:28:21.193646+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: faculty_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.faculty_profiles (id, email, password_hash, employee_id, full_name, qualification, designation, department, school, teaching_experience, phone, academic_year, appraisal_role, is_verified, avatar, created_at, updated_at, is_active, reports_to_registrar) FROM stdin;
82457926-4374-47be-8988-03b8eabb63f3	anupama.patil@dypiu.ac.in	$2b$12$my7QKXgbKVw.bHUMesFi3uRelR6L7bx1DxHe/cS3WNWZOH8.Z8rB2	\N	Dr. Anupama Patil				SoEMR			\N	director	t	\N	2026-05-11 10:33:16.284231+00	2026-05-11 10:33:16.284237+00	t	f
80d3ded8-365a-455b-bae2-846bf423a7ad	admin@dypatil.edu	$2b$12$qcXvEq3zaGKoTQfW1A1E8OUa1/60tvnjUbQ6UyftGI8AbvcuQuE2W	\N	System Administrator	\N	\N	\N	\N	\N	\N	\N	admin	t	\N	2026-05-11 10:33:29.34105+00	2026-05-11 10:33:29.34105+00	t	f
518818ae-e517-43f2-ad03-f26d165b8a3e	swapnil.bhurat@dypiu.ac.in	$2b$12$HlpaNgJhZvaBEWE4kErnhO66aalFiaKphLRwVlArm1oqiPknQPjmy	\N	Dr. Swapnil Bhurat				SoCE			\N	director	t	\N	2026-05-11 10:35:31.8878+00	2026-05-11 10:35:31.887806+00	t	f
f5847980-386e-4157-a3d3-ad8785c913c3	ramendra.pandey@dypiu.ac.in	$2b$12$owkHD5shwIJVYOd83.f6I.tKIvxR8vWWTVwRwsOU0nXDvC3vhTJ4e	\N	Dr. Ramendra Pandey				SoBB			\N	director	t	\N	2026-05-11 10:36:08.444203+00	2026-05-11 10:36:08.444209+00	t	f
375b0b50-9a71-437f-bd44-594b553c4894	rahul.sharma@dypiu.ac.in	$2b$12$64NXl3eOKSDrg4PjnXY7DuLsqAFvPz3xqvt2Uxir7/1zMnFHKOtAS	\N	Dr. Rahul Sharma				SoCSEA			\N	director	t	\N	2026-05-11 10:37:25.563925+00	2026-05-11 10:37:25.563934+00	t	f
6d34fd6b-16fc-43fe-9a7b-db72fd6375da	ganesh.jadhav@dypiu.ac.in	$2b$12$pXJ.Oi3BCDsvKWzIdaE8m..bmVLGSvPCo7VarxJfL4/aWZaCRJ7jy	\N	Dr. Ganesh Jadhav			Mechanical Engineering	SoEMR			\N	hod	t	\N	2026-05-11 10:38:25.823524+00	2026-05-11 10:38:25.823531+00	t	f
10bdb6c5-f70d-430f-a4d5-f8b7b239ef6d	ruhandave2003@gmail.com	$2b$12$VYGK9cEZx0hlqsKR/XiOl.yoKfN09nJyr/q3z7C7TozIVsmAdM51.	\N	Ruhan OP	\N	\N	\N	\N	\N	\N	\N	admin	t	\N	2026-05-11 10:34:11.460343+00	2026-05-11 10:38:58.696791+00	t	f
d5318c4a-0a28-4653-b518-fdfbd03b7b8f	pravin.gorde@dypiu.ac.in	$2b$12$2C/LtsTc5AZ19w58Ohjd/O0W38GBXk10nV8e8PYehpMTqdod976U6	\N	Dr. Pravin Gorde			Civil Engineering	SoEMR			\N	hod	t	\N	2026-05-11 10:39:12.575759+00	2026-05-11 10:39:12.575766+00	t	f
acdd9a89-6f36-41a3-9aee-af9d08fc206e	madhavi.deshpande@dypiu.ac.in	$2b$12$4N4gx3Q8LKKw6ZWNz7pEsOCmkgqoOMLu0WXJS2it1Vr18NiGBd...	\N	Dr. Madhavi Deshpande				SoC			\N	director	t	\N	2026-05-11 10:39:56.619132+00	2026-05-11 10:39:56.619138+00	t	f
31621290-cae5-4ad9-a0c6-e3f4caedf7d7	arvind.kumar@dypiu.ac.in	$2b$12$oNAgl6PWPl5tSS3eHAEZGevsDmt4TD6c6pZHxCobUMfHFZ8d8ie2S	\N	Dr. Arvind Kumar				SoMCS			\N	director	t	\N	2026-05-11 10:40:30.697463+00	2026-05-11 10:40:30.69747+00	t	f
970b635c-cab2-460b-a867-4df515b3f30b	sunil.talekar@dypiu.ac.in	$2b$12$lc.SaBH9SfwxTCY.nhNLSukV8xwz9U/0ItDY51KcP6j6ifmzzV9/a	\N	Dr. Sunil Talekar				SoD			\N	director	t	\N	2026-05-11 10:40:58.681787+00	2026-05-11 10:40:58.681793+00	t	f
103a8aa5-b175-434f-9715-dc712ed5f691	jaiprakash.kalwale@dypiu.ac.in	$2b$12$8KIoG4QwtwGEXXx7lnUaRO83lNPOOgyk37P5ejTcgNDuoDktpe89K	\N	Dr. Jaiprakash Kalwale				SoAA			\N	director	t	\N	2026-05-11 10:41:39.241606+00	2026-05-11 10:41:39.241613+00	t	f
20ab3ef0-edc3-4d8c-a00c-976fd6cdd833	shashi.singh@dypiu.ac.in	$2b$12$Lkm76R/mBKTqvCaz7kiVjuZfRext/o1rKUfJ7BKKt2DLsd.0s39Oe	\N	Dr. Shashi Singh				CISR			\N	center_head	t	\N	2026-05-11 10:42:14.539182+00	2026-05-11 10:42:14.539188+00	t	f
9fa64bb5-31a5-48e3-af15-353dff2eba5d	siddharth.gavhale@dypiu.ac.in	$2b$12$znFsfgB594j/FbyDtAO.zODMUeNCzh2ZW1BbvsKr5MvmHn/pB8B8i	\N	Dr. Siddharth Gavhale				CISR			\N	faculty	t	\N	2026-05-11 10:42:46.208512+00	2026-05-11 10:42:46.208518+00	t	f
9586a837-2ea5-449e-af02-c9d91c55c7ec	amit.umbrajkar@dypiu.ac.in	$2b$12$3/ukby437bWxfRdn6lV.s.2o/EC.be09WJi3TP5aT7XtKmrhGdK32	\N	Dr. Amit Umbrajkar			Mechanical Engineering	SoEMR			\N	faculty	t	\N	2026-05-11 10:43:49.08927+00	2026-05-11 10:43:49.089276+00	t	f
a0d948b0-3c7b-43cc-be46-1f5fa56ec177	tejashri.gulve@dypiu.ac.in	$2b$12$aXyVppcdqoEVOpgAYNjuG.h5l.EZw0P22QndAcPL5KcHD2uyCR5DC	\N	Tejashri Gulve			Civil Engineering	SoEMR			\N	faculty	t	\N	2026-05-11 10:44:43.616179+00	2026-05-11 10:44:43.616185+00	t	f
95e32030-a128-4831-a442-5d0f6a98a846	sandhya.shinde@dypiu.ac.in	$2b$12$oJMCbS4ZFtYYaqWTTSQ7qu6JZyC.VDbqiLxgeI9E13WKdfc0Wmule	\N	Dr. Sandhya Shinde			Semiconductor Engineering	SoEMR			\N	faculty	t	\N	2026-05-11 10:45:22.319099+00	2026-05-11 10:45:22.319105+00	t	f
42bef7db-c3ce-4cf2-94f9-038bf2d61111	priya.charles@dypiu.ac.in	$2b$12$ekvUxpaLU6Kqk9UxGIA4P.4VKETYqyoG79gL9QE7C3QqJstmTKqXq	\N	Dr. Priya Charles			Semiconductor Engineering	SoEMR			\N	hod	t	\N	2026-05-11 10:45:56.257614+00	2026-05-11 10:45:56.257626+00	t	f
d37adeda-bb64-471d-94cd-351ceae5c1e5	ram.kunwer@dypiu.ac.in	$2b$12$U88piw96zzhN4FDgLD2yPOEzCUIhNAZi2NaSsX7NssqoF8tLuK7Ju	\N	Dr. Ram Kunwer				SoCE			\N	faculty	t	\N	2026-05-11 10:46:47.691149+00	2026-05-11 10:46:47.691158+00	t	f
b884d392-0982-4892-9406-8ecfb1c5574d	surabhi.sonam@dypiu.ac.in	$2b$12$6PvLam1S4fusnroam6vKoetEx2rYczN6j1gUzaGj1l/LCMtnsiwca	\N	Dr. Surabhi Sonam				SoBB			\N	faculty	t	\N	2026-05-11 10:47:22.823881+00	2026-05-11 10:47:22.823887+00	t	f
a0501b55-e684-4662-90f0-1c900d588a9f	gaurav.singh@dypiu.ac.in	$2b$12$zwCW2dMKyUzuPjm394WLZuYYULZSDeDTIqhJmY200bwPvKqhGNsbe	\N	Dr. Gaurav Kumar Singh				SoCSEA			\N	faculty	t	\N	2026-05-11 10:48:14.005352+00	2026-05-11 10:48:14.005361+00	t	f
4a67cf60-1fd9-4085-9782-7cbf1f25140a	priyanka.dhoot@dypiu.ac.in	$2b$12$WIDtxsDXckToKXIOTJYTjexEEO.rkLblzPdDXoJpH/CtKj2VWJZpa	\N	Dr. Priyanka Dhoot				SoC			\N	faculty	t	\N	2026-05-11 10:48:48.72137+00	2026-05-11 10:48:48.721381+00	t	f
0e53ce20-235e-479e-8024-ed5a55e85f38	anuradha.patil@dypiu.ac.in	$2b$12$kn9G8zFaeZ9ykstd02t2de5AtQlKQuwRCiUpnkUq.zNk3Q.apcdG6	\N	Dr. Anuradha Patil				SoC			\N	faculty	t	\N	2026-05-11 10:50:01.884511+00	2026-05-11 10:50:01.884517+00	t	f
59896300-c2aa-4d9f-904e-032065b3a067	pallavi.jha@dypiu.ac.in	$2b$12$Ilo/yusuvMCaHPITHeDNG.eVLS9.ffgMuzPRarE.f2.U4zdR57uJK	\N	Dr. Pallavi Jha				SoMCS			\N	faculty	t	\N	2026-05-11 10:50:43.624572+00	2026-05-11 10:50:43.624578+00	t	f
b89c7df5-0a3f-4b51-974e-73a6c1c40ba7	jeevraj.bhalerao@dypiu.ac.in	$2b$12$4YPvU2QVHfVWlAAxcHrMMO.MjohI4MYnGcGksbNSgsQ30QXi3kKCC	\N	Jeevraj Bhalerao				SoD			\N	faculty	t	\N	2026-05-11 10:51:25.661387+00	2026-05-11 10:51:25.661393+00	t	f
8aef63fb-dc12-43be-8482-3c8c734a2137	samata.bendre@dypiu.ac.in	$2b$12$eqn4PkNb4PaL/EGzcM.GzO99oWqf3i4J8xsD/ordg0J8DpKrS/YMK	\N	Samata Bendre				SoAA			\N	faculty	t	\N	2026-05-11 10:52:00.300518+00	2026-05-11 10:52:00.300524+00	t	f
84993764-497d-4c1f-bbe3-d723aade0445	vitthal.dhumal@dypiu.ac.in	$2b$12$JJPzzTEhSipLNk52FwCfq.Hi4/tILqbPDpVoadeq4kaoalo/KMXCy	\N	Vitthal Dhumal							\N	non_teaching_staff	t	\N	2026-05-11 10:52:29.843319+00	2026-05-11 10:52:29.843327+00	t	f
ad849435-721c-4418-ba6b-1c6564e53e88	anurag.pandey@dypiu.ac.in	$2b$12$Vtq6CoBX26z9B6xQm4rk8eJL3Yh.FOwdiRUs0X2Wza4UWLg57yf0q	\N	Anurag Pandey							\N	non_teaching_staff	t	\N	2026-05-11 10:53:00.850619+00	2026-05-11 10:53:00.850625+00	t	f
82fa0041-fd36-4589-999f-1a1f68ca9599	hetal.patel@dypiu.ac.in	$2b$12$HbJBu.e3rce8/OSchoo0X.o7Irrl6oun4v4A5A05DTgQ7XiuEfigO	\N	Hetal Patel							\N	non_teaching_staff	t	\N	2026-05-11 10:53:22.723313+00	2026-05-11 10:53:22.723322+00	t	f
e9927779-971b-4784-b045-0cfbf2b7e0f6	anania.arjuna@dypiu.ac.in	$2b$12$SwvNf83k1nWjMn/NjNKnCOQfWi5XD7u/lqPs9HdCw470TR1hzNsg2	\N	Dr. Anania Arjuna							\N	non_teaching_staff	t	\N	2026-05-11 10:54:07.278531+00	2026-05-11 10:54:07.278536+00	t	f
ba6033a4-41d4-4798-ae70-2f7979887a52	registrar@dypiu.ac.in	$2b$12$1AMsHEfefk0IaqX0cdyyq.8tys21xyiiRvt6H8.ACKbBXoQewDOHG	\N	Dr Beeran Moidin BM							\N	registrar	t	\N	2026-05-11 10:56:23.259687+00	2026-05-11 10:56:23.259692+00	t	f
0e2fab53-b187-422e-a8cf-5f8f185d3b9f	deanfaculties_nonengineering@dypiu.ac.in	$2b$12$OxGrmqVpXIfxPqPxpRfEr.FvV/qToOIDZjEOD7DDlUxp6BBdj4Yu6	\N	Dr. Madhavi Deshpande				SoC			\N	dean	t	\N	2026-05-11 10:32:02.989491+00	2026-05-11 11:08:28.276839+00	t	f
66e222b8-c549-4a8b-84bb-42b46d17db17	deanfaculties_engineering@dypiu.ac.in	$2b$12$rTfc4pGC9JxQVSbnuYN9Ru2LBOCkslajvLox3IgkrE8MCDi3hHz1S	\N	Dr. Anupama Patil				engineering			\N	dean	t	\N	2026-05-11 10:28:06.863465+00	2026-05-11 11:09:57.778339+00	t	f
85d1bb4a-0747-4f6a-a9d8-e0be738908a2	vc@dypiu.ac.in	$2b$12$tsH87BfWuFkMbNmyhvK.Re6rXr6C8NtSacigm5sYvq1tLYI99ZIjO	\N	Prof Manish Bhalla	\N	\N	\N	\N	\N	\N	\N	vc	t	\N	2026-05-11 11:27:11.173165+00	2026-05-11 11:27:11.173165+00	t	f
36296265-cc7a-4af8-bd1c-b95623fef27e	samarthgangji@gmail.com	$2b$12$uKW4XgWhkf.b0l/oNwcQI.S7vKJU09s7uB8hwFY7W.lHWcYAIAj1i	\N	Samarth				SoCSEA			\N	faculty	t	\N	2026-05-11 11:29:59.999248+00	2026-05-11 11:29:59.999254+00	t	f
0498cd75-d888-4b2b-b132-99e65da4940b	ruhansaaddave@gmail.com	$2b$12$QrDmw3pcJ2C9VczB8ghu.udoL2QKykBrjtMHFdFZwoE5Sy9p3P4pC	\N	Ruhan Testing account				SoCSEA			\N	faculty	t	\N	2026-05-11 11:44:46.326393+00	2026-05-11 11:45:25.278891+00	t	f
cf74efd9-b9b9-4ede-9ec0-6e283fc34c05	sunil.dambhare@dypiu.ac.in	$2b$12$iJ8KVNkFAUU3ovHLKL4V5OT5XKU8p4ZTMJMBzjbGvin/cIwZcSuX2	20251002	Dr. Sunil Dambhare	Ph.D	Professor	Mechanical Engineering	SoEMR	30	99229 64996	\N	faculty	t	\N	2026-05-11 11:02:24.705716+00	2026-05-11 11:55:30.746689+00	t	f
46c06929-211e-4624-ad15-34a2f22c5010	sdeshkar2005@gmail.com	$2b$12$yN.HpriRZ0G/q5jjG24VTe4i28EA/Akn7lO2rPjAqw54wSHhrhW42	emp-26	Sanika		Assistant Professor		SoCSEA — School of Computer Science, Engineering & Applications			\N	faculty	t	\N	2026-05-11 16:26:41.33443+00	2026-05-11 16:28:29.364321+00	t	f
0f642f78-61d1-481f-97d3-b72aad8a9c04	director_testing@dypiu.ac.in	$2b$12$6lYth.FAhUB/./.nmbMD/e7teBd9Yb4YXoQ7wYCO3rUD2l8DMwIcm	\N	Anushka				SoBB			\N	director	t	\N	2026-05-12 05:15:31.728885+00	2026-05-12 05:15:31.728892+00	t	f
96c72a7b-1caf-49e2-9f9d-f1a3a6312597	samarthgangji2405@gmail.com	$2b$12$5WT9aSKTuP/JlO/6kUgb7eJHI06EpUPMHjssKNPfRMyfcWw10F6Cm	E6	Faculty_Testing	PhD	Assistant Professor	\N	SoBB — School of Bio-Engineering & Bio Science	10	+918149547427	\N	faculty	t	\N	2026-05-11 22:08:11.576235+00	2026-05-11 22:08:49.067062+00	t	f
7e35b5ce-fc9f-4a5d-80fe-11f509e457da	providence2405@gmail.com	$2b$12$eEth8qD/HjuN.g88i57h2O1X7eWlxPtYu6YmB.7DNAbVCm3as.5LS	45	f_test	PhD	Assistant Professor		SoBB	10	+918149547427	\N	faculty	t	\N	2026-05-12 05:17:16.138859+00	2026-05-12 05:30:45.453451+00	t	f
9d7f7186-ebeb-4adf-bc7a-7b0ddef23f10	design_testing@dypiu.ac.in	$2b$12$jbNQw.G3LOkct4vIr0oCrOLrbCpxZYbqCwzRGhw2d0PUVkieXsIlu	\N	S				SoD			\N	faculty	t	\N	2026-05-12 05:32:23.590773+00	2026-05-12 05:32:23.590778+00	t	f
7aa1df8d-1607-450b-a2c7-00feb0c43cb4	test_direct@admin.in	$2b$12$xQcvPnGAJBG78dr7OMln6.MT8AXMlsDkAFCQAfJoYxq8Z4sqaNQoK	\N	Test_direct_registrar							\N	non_teaching_staff	t	\N	2026-05-12 05:43:42.37871+00	2026-05-12 05:43:42.378716+00	t	f
a3a5ae20-18de-432e-862e-2f1dbfaeeaac	test_name@admin.in	$2b$12$hX2C3K1B1qVF5OKnoSHju.eJDhi7uP64iuCOeQD19UXunbOzQ9obe	\N	test school name			Mechanical Engineering	SoEMR			\N	faculty	t	\N	2026-05-12 05:53:47.782443+00	2026-05-12 05:53:47.782449+00	t	f
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback (id, name, email, category, subject, message, status, ip_address, user_agent, submitted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: form_section_definitions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.form_section_definitions (code, form_family, part, section_key, title, max_marks, storage_table, fields, created_at, updated_at) FROM stdin;
standard_lectures_50	standard	A	lectures	A1. Lectures / Tutorials / Practicals	50	teaching_process	["semester", "course_code", "planned_classes", "conducted_classes"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
design_lectures_40	design_arts	A	lectures	A(i). Lectures / Tutorials / Practicals	40	teaching_process	["semester", "course_code", "planned_classes", "conducted_classes"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
course_file_20	all_teaching	A	courseFile	A2. Course File	20	course_files	["course", "title", "details"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
innovative_teaching_10	all_teaching	A	innovativeTeaching	A3. Innovative Teaching-Learning	10	innovative_teaching	["details"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
standard_projects_10	standard	A	projects	A4. Projects	10	projects_guided	["label"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
design_projects_20	design_arts	A	projects	A(iv). Project Guidance	20	projects_guided	["label"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
qualification_10	all_teaching	A	quals	A5. Qualification Enhancement	10	qualification_enhancement	["label"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
student_feedback_10	all_teaching	A	feedback	Student Feedback	10	student_feedback	["course_code", "feedback_1", "feedback_2"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
department_activities_20	all_teaching	A	deptActs	Departmental / School Activities	20	department_activities	["activity", "nature"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
university_activities_30	all_teaching	A	uniActs	University Level Activities	30	university_activities	["activity", "nature"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
society_10	all_teaching	A	society	Contribution to Society	10	social_contributions	["activity", "status", "details"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
industry_5	standard_design	A	industry	Industry Connect	5	industry_connect	["name", "details"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
acr_25	all_teaching	A	acr	Annual Confidential Report - School Level	25	acr_scores	["label"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
standard_journals_120	standard	B	journals	B1. Research Papers / Journal Publications	120	journal_publications	["title", "journal", "issn", "indexing"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
media_design_journals_80	media_design	B	journals	B1(i). Published Papers in Journals	80	journal_publications	["title", "journal", "issn", "indexing"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
media_popular_writings_40	media	B	popularWritings	B1(ii). Popular Writings, Film & Documentary	40	popular_writings	["media", "film"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
standard_books_50	standard	B	books	B2. Books / Book Chapters	50	book_publications	["title", "book", "issn", "publisher", "coauthor", "first_author"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
media_design_books_60	media_design	B	books	B2. Articles / Chapters in Books	60	book_publications	["title", "book", "isbn", "publisher", "coauthor", "first_author"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
standard_ict_20	standard	B	ict	B3. ICT / E-Content / Pedagogy	20	ict_pedagogy	["title", "description", "type", "quadrant"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
media_ict_30	media	B	ict	B3. ICT Mediated Teaching-Learning Pedagogy / New Curricula	30	ict_pedagogy	["title", "description", "type", "quadrant"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
design_ict_50	design_arts	B	ict	B3. ICT Mediated Teaching-Learning Pedagogy / New Curricula	50	ict_pedagogy	["title", "description", "type", "quadrant"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
research_guidance_30	all_teaching	B	research	B4(a). Research Guidance - PhD / PG	30	research_guidance	["degree", "student_name", "thesis"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
standard_internal_projects_45	standard	B	projects2	B4(b). Research / Consultancy Internal Projects	45	research_projects	["title", "agency", "sanction_date", "amount", "role", "project_status"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
standard_external_projects_45	standard	B	externalProjects	B4(c). Research / Consultancy External Projects	45	external_research_projects	["title", "agency", "sanction_date", "amount", "role", "project_status"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
media_design_internal_projects_15	media_design	B	internalProjects	B4(b). Internal Research Projects	15	research_projects	["title", "agency", "sanction_date", "amount", "role", "project_status"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
media_external_projects_30	media	B	externalProjects	B4(c). External Research Projects	30	external_research_projects	["title", "agency", "sanction_date", "amount", "role", "project_status"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
design_external_projects_30	design_arts	B	externalProjects	B4(c). External Research / Consultancy Projects	30	external_research_projects	["title", "agency", "sanction_date", "amount", "role", "project_status"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
standard_patents_40	standard	B	patents	B5(a). Patents (IPR)	40	patents	["title", "type", "scope", "patent_date", "patent_status", "file_no"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
design_ipr_40	design_arts	B	ipr	B5(a). IPR / Copyright / Patent	40	ipr_records	["title", "scope", "ipr_date", "ipr_status", "file_no"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
standard_awards_10	standard	B	awards	B5(b). Awards	10	awards	["title", "award_date", "agency", "level"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
media_design_research_awards_10	media_design	B	awards	B5(b). Research Awards	10	awards	["title", "award_date", "agency", "level"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
standard_presentations_30	standard	B	confs	B6. Invited Lectures / Resource Person / Paper Presentations	30	conferences	["title", "type", "organization", "level"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
media_design_conferences_30	media_design	B	confs	B5. Conferences / Seminars / Workshops	30	conferences	["title", "type", "organization", "level"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
standard_proposals_10	standard	B	proposals	B7(a). Submitted Research Proposals	10	research_proposals	["title", "duration", "agency", "amount"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
media_proposals_10	media	B	proposals	B6(a). Research Proposals	10	research_proposals	["title", "duration", "agency", "amount"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
design_proposals_10	design_arts	B	proposals	B7. Research Proposals	10	research_proposals	["title", "duration", "agency", "amount"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
standard_products_10	standard	B	products	B7(b). Product Developed and Used by Students in Lab / Commercialized	10	products_developed	["details", "usage"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
media_products_20	media	B	products	B6(b). Products Developed / Used	20	products_developed	["details", "usage"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
standard_fdp_10	standard	B	fdps	B8(a). FDP / Workshops	10	self_development	["program", "duration", "organization"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
media_fdp_20	media	B	fdps	B7. FDP / Workshops	20	self_development	["program", "duration", "organization"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
design_fdp_10	design_arts	B	fdps	B8(a). FDP / Workshops	10	self_development	["program", "duration", "organization"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
industrial_training_10	all_teaching	B	training	B8(b). Industrial Training	10	industrial_training	["company", "duration", "nature"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
non_teaching_resp_10	non_teaching	A	selfResp	Current Responsibilities	10	non_teaching_part_a_items	["details"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
non_teaching_contrib_10	non_teaching	A	selfContrib	Other Useful Contributions	10	non_teaching_part_a_items	["details"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
non_teaching_achieve_5	non_teaching	A	selfAchieve	Achievements	5	non_teaching_part_a_items	["details"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
non_teaching_prof_comp_25	non_teaching	B	profComp	Professional Competence	25	non_teaching_part_b_ratings	["rating"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
non_teaching_quality_25	non_teaching	B	quality	Quality of Work	25	non_teaching_part_b_ratings	["rating"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
non_teaching_personal_30	non_teaching	B	personal	Personal Characteristics	30	non_teaching_part_b_ratings	["rating"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
non_teaching_regular_25	non_teaching	B	regular	Regularity	25	non_teaching_part_b_ratings	["rating"]	2026-05-11 10:18:34.813473+00	2026-05-11 10:18:34.813473+00
\.


--
-- Data for Name: ict_pedagogy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ict_pedagogy (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, title, description, type, quadrant, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
52e42eb7-7b8e-45cf-9b23-83a2c8646151	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B3. ICT / E-Content / Pedagogy	\N	1	ICT	Report	website	1	20	\N	\N	\N	\N	2026-05-11 11:40:49.101348+00	2026-05-11 11:40:49.101353+00
503ff24a-d866-4b7c-aa09-fa4b0d284517	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B3. ICT / E-Content / Pedagogy	\N	2	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.106829+00	2026-05-11 11:40:49.106834+00
74951bbc-02e1-44eb-b938-e49e7752c12e	pravin.gorde@dypiu.ac.in	2025-2026	standard	B3. ICT / E-Content / Pedagogy	\N	1	ICT	Website	Quiz	1	20	\N	\N	\N	\N	2026-05-11 13:14:03.533334+00	2026-05-11 13:14:03.533339+00
57ef890d-14dc-4985-91ce-7bf23602fcd6	pravin.gorde@dypiu.ac.in	2025-2026	standard	B3. ICT / E-Content / Pedagogy	\N	2	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.535698+00	2026-05-11 13:14:03.535702+00
a8b4f0e0-ab9b-4683-81e3-d88fb239c2a5	samarthgangji2405@gmail.com	2025-2026	standard	B3. ICT / E-Content / Pedagogy	\N	1	a	a	aaa	a	3	\N	\N	\N	\N	2026-05-12 04:49:02.097837+00	2026-05-12 04:49:02.097841+00
73a68559-2569-4dcd-aff9-c4a7f670405a	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B3. ICT / E-Content / Pedagogy	\N	1	Website	www.dypiu.ac.in	e content	IV	20	20	20	20	\N	2026-05-11 11:51:53.786858+00	2026-05-12 04:56:59.745212+00
b38e6236-261b-459c-be9c-bd34124efd3e	ram.kunwer@dypiu.ac.in	2025-2026	standard	B3. ICT / E-Content / Pedagogy	\N	1	\N	\N	\N	\N	0	\N	0	0	\N	2026-05-11 12:12:53.497534+00	2026-05-12 04:59:00.486352+00
513108f5-6c92-407a-90f1-6e3880ee9fc1	providence2405@gmail.com	2025-2026	standard	B3. ICT / E-Content / Pedagogy	\N	1	a	a	a	a	20	\N	20	\N	\N	2026-05-12 05:28:21.203161+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: industrial_training; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.industrial_training (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, company, duration, nature, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
8eb80fa8-063c-4901-9b77-f862aa8ccdad	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B8(b). Industrial Training	\N	1	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.111007+00	2026-05-11 11:40:49.111012+00
d08d6634-eb06-4526-be7a-4dd136ad5352	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B8(b). Industrial Training	\N	2	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.111021+00	2026-05-11 11:40:49.111022+00
bede05a7-01b2-4772-915e-199292ec89f6	pravin.gorde@dypiu.ac.in	2025-2026	standard	B8(b). Industrial Training	\N	1	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.538563+00	2026-05-11 13:14:03.538567+00
bee95b20-c6a8-4bf6-ae42-e60b8bcde289	pravin.gorde@dypiu.ac.in	2025-2026	standard	B8(b). Industrial Training	\N	2	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.538577+00	2026-05-11 13:14:03.538578+00
86639ef0-4148-4d2d-9bcc-df93121f44b5	samarthgangji2405@gmail.com	2025-2026	standard	B8(b). Industrial Training	\N	1	a	aa	a	3	\N	\N	\N	\N	2026-05-12 04:49:02.10137+00	2026-05-12 04:49:02.101375+00
a3c0386b-dcb0-4c6e-ae4a-481d2d617bb3	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B8(b). Industrial Training	\N	1	\N	\N	\N	0	0	0	0	\N	2026-05-11 11:51:53.792355+00	2026-05-12 04:56:59.745212+00
b942b8c7-fb70-4d07-8d35-4e1f173615ec	ram.kunwer@dypiu.ac.in	2025-2026	standard	B8(b). Industrial Training	\N	1	\N	\N	\N	0	\N	0	0	\N	2026-05-11 12:12:53.50271+00	2026-05-12 04:59:00.486352+00
4a1fe6bb-577b-4a0d-aed5-b57af7ccefd7	providence2405@gmail.com	2025-2026	standard	B8(b). Industrial Training	\N	1	a	a	a	5	\N	5	\N	\N	2026-05-12 05:28:21.209059+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: industry_connect; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.industry_connect (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, name, details, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
4f55f8e0-1362-4db6-84ec-b15b25f23e80	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Industry Connect	\N	1	MOU	Guest Lecture	5	\N	\N	\N	\N	2026-05-11 11:40:48.988502+00	2026-05-11 11:40:48.988507+00
4f8579c1-6bd7-4057-bf0b-4a3f861c4ebc	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Industry Connect	\N	2	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:48.993908+00	2026-05-11 11:40:48.993912+00
e507a367-ca7e-41d3-916b-628eaf275449	pravin.gorde@dypiu.ac.in	2025-2026	standard	Industry Connect	\N	1	Ultratech	MOU	5	\N	\N	\N	\N	2026-05-11 13:14:03.471903+00	2026-05-11 13:14:03.471907+00
2b60fede-c489-4c4e-abdf-62659f175d40	samarthgangji2405@gmail.com	2025-2026	standard	Industry Connect	\N	1	a	a	3	\N	\N	\N	\N	2026-05-12 04:49:02.05438+00	2026-05-12 04:49:02.054384+00
173e126e-c8d9-4100-922c-6f131173bed2	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Industry Connect	\N	1	Atlas COPCO	Curriculum Development	5	10	10	10	\N	2026-05-11 11:51:53.70347+00	2026-05-12 04:56:59.745212+00
e20886a2-f4d5-4191-8200-aa0f883a85e0	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Industry Connect	\N	2	Dassault Systems	CoE	5	10	10	10	\N	2026-05-11 11:51:53.703482+00	2026-05-12 04:56:59.745212+00
ae0d3e61-20e8-4387-83d1-e48b9b30ee3a	ram.kunwer@dypiu.ac.in	2025-2026	standard	Industry Connect	\N	1	SYNOPSIS	LAB	5	\N	4	5	\N	2026-05-11 12:12:53.418541+00	2026-05-12 04:59:00.486352+00
4090621f-ac43-4753-bc5c-b96d6d903072	providence2405@gmail.com	2025-2026	standard	Industry Connect	\N	1	a	a	5	\N	5	\N	\N	2026-05-12 05:28:21.133707+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: innovative_teaching; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.innovative_teaching (id, faculty_email, academic_year, form_family, section_title, max_marks, details, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
32da97a1-ee6f-4171-af87-a74260638416	tejashri.gulve@dypiu.ac.in	2025-2026	standard	A3. Innovative Teaching-Learning	\N		2	\N	\N	\N	\N	2026-05-11 11:40:48.997722+00	2026-05-11 11:40:48.997726+00
92a1ac60-7076-40c9-8d6f-9d9904e4e16f	sunil.dambhare@dypiu.ac.in	2025-2026	standard	A3. Innovative Teaching-Learning	\N		8	\N	\N	\N	\N	2026-05-11 11:51:53.708349+00	2026-05-11 11:51:53.708353+00
7eebdb76-bb19-46dc-aef6-c9c7dde604c2	ram.kunwer@dypiu.ac.in	2025-2026	standard	A3. Innovative Teaching-Learning	\N		4	\N	\N	\N	\N	2026-05-11 12:12:53.423676+00	2026-05-11 12:12:53.423681+00
457d72bc-0fb8-4ce7-8ff8-e7748242c0ff	pravin.gorde@dypiu.ac.in	2025-2026	standard	A3. Innovative Teaching-Learning	\N	Blended Learning, Virtual Lab, LMS, Project Based Learning, Flip Classroom	10	\N	\N	\N	\N	2026-05-11 13:14:03.476382+00	2026-05-11 13:14:03.476387+00
597f6ae2-3bbf-439c-b053-1eb7e6dcc8a0	samarthgangji2405@gmail.com	2025-2026	standard	A3. Innovative Teaching-Learning	\N		2	\N	\N	\N	\N	2026-05-12 04:49:02.057213+00	2026-05-12 04:49:02.057217+00
4b7b7d10-3157-4de8-b0bb-479bc4ef9107	providence2405@gmail.com	2025-2026	standard	A3. Innovative Teaching-Learning	\N		2	\N	\N	\N	\N	2026-05-12 05:28:21.138694+00	2026-05-12 05:28:21.138698+00
\.


--
-- Data for Name: ipr_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ipr_records (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, title, scope, ipr_date, ipr_status, file_no, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: journal_publications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.journal_publications (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, title, journal, issn, indexing, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
3d7cc696-7caa-4647-be46-a359cd760489	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B1. Research Papers / Journal Publications	\N	1	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.117284+00	2026-05-11 11:40:49.117289+00
19861375-1bf3-4c26-9295-0801e018ab5f	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B1. Research Papers / Journal Publications	\N	2	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.117297+00	2026-05-11 11:40:49.117299+00
7ff38b77-f4b7-4eed-bd4e-605d9544e39b	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B1. Research Papers / Journal Publications	\N	3	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.117305+00	2026-05-11 11:40:49.117307+00
eb2a245a-5dd2-4aae-ae74-7058321c6bef	pravin.gorde@dypiu.ac.in	2025-2026	standard	B1. Research Papers / Journal Publications	\N	1	Design and Development of 3 Axis 3D Printing of Sustainable Concrete Structures and Characterization of Affordable Housing Solutions	Tuijin Jishu/Journal of Propulsion Technology	ISSN: 1001-4055	scopus	30	\N	\N	\N	\N	2026-05-11 13:14:03.545157+00	2026-05-11 13:14:03.545163+00
45a44e4c-dfa2-4043-bdd8-8983a1b7b462	pravin.gorde@dypiu.ac.in	2025-2026	standard	B1. Research Papers / Journal Publications	\N	2	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.550266+00	2026-05-11 13:14:03.55027+00
2bea7c54-2cd3-4c30-a001-5aad3d256560	pravin.gorde@dypiu.ac.in	2025-2026	standard	B1. Research Papers / Journal Publications	\N	3	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.550282+00	2026-05-11 13:14:03.550284+00
77a2e2be-9ede-4fb4-9764-e0faa041346d	samarthgangji2405@gmail.com	2025-2026	standard	B1. Research Papers / Journal Publications	\N	1	a	a	a	a	3	\N	\N	\N	\N	2026-05-12 04:49:02.104434+00	2026-05-12 04:49:02.104439+00
6bbc1853-1c3f-4dc4-8cec-7129e180d620	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B1. Research Papers / Journal Publications	\N	1	Effect of Grain Size	Journal of	2233 3344	Scopus	10	20	20	20	\N	2026-05-11 11:51:53.798033+00	2026-05-12 04:56:59.745212+00
579aaaf9-7091-401d-acd5-21a39f46684d	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B1. Research Papers / Journal Publications	\N	2	ResearchPaper	Journal of	1123 3245	Scopus	10	20	20	20	\N	2026-05-11 11:51:53.798046+00	2026-05-12 04:56:59.745212+00
c7743a33-d8b8-4d7e-b67e-ed4f06f6072d	ram.kunwer@dypiu.ac.in	2025-2026	standard	B1. Research Papers / Journal Publications	\N	1	Research article	Scientific Report	01010	01	10	\N	16	20	\N	2026-05-11 12:12:53.510012+00	2026-05-12 04:59:00.486352+00
7a244dbd-8e97-48b3-80db-811ab15b2897	ram.kunwer@dypiu.ac.in	2025-2026	standard	B1. Research Papers / Journal Publications	\N	2	Research Article	Scientific Report	0329309	92	10	\N	16	20	\N	2026-05-11 12:12:53.510037+00	2026-05-12 04:59:00.486352+00
99f1af09-6905-4503-97e0-128c25164aac	providence2405@gmail.com	2025-2026	standard	B1. Research Papers / Journal Publications	\N	1	a	a	a	a	100	\N	100	\N	\N	2026-05-12 05:28:21.220485+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: module_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.module_config (id, appraisal_module_enabled, self_appraisal_enabled, peer_review_enabled, updated_at) FROM stdin;
1	t	t	f	2026-05-11 10:18:34.813473+00
\.


--
-- Data for Name: non_teaching_appraisals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.non_teaching_appraisals (id, staff_email, academic_year, payload, status, self_total, ro_total, registrar_total, vc_total, submitted_at, ro_reviewed_at, registrar_reviewed_at, vc_reviewed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: non_teaching_part_a_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.non_teaching_part_a_items (id, staff_email, academic_year, item_key, title, max_marks, details, self_marks, ro_marks, registrar_marks, vc_marks, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: non_teaching_part_b_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.non_teaching_part_b_ratings (id, staff_email, academic_year, section_key, section_title, max_marks, parameter_no, parameter_label, ro_rating, registrar_rating, vc_rating, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, email, token_hash, expires_at, used, created_at) FROM stdin;
98327937-2c8c-415f-9c1f-fd3c7c718eb9	ruhansaaddave@gmail.com	098f153151644cc33fa770c08b9488d6dc0676805d96bad917e20214dc2a1e42	2026-05-11 12:44:49.730149+00	t	2026-05-11 11:44:49.730798+00
\.


--
-- Data for Name: patents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patents (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, title, type, scope, patent_date, patent_status, file_no, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
46b4a729-87fa-4603-be2a-8f435a853f2d	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B5(a). Patents (IPR)	\N	1	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.125247+00	2026-05-11 11:40:49.125252+00
0c86fec3-4c2d-4ed8-9d02-8d197b7d244f	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B5(a). Patents (IPR)	\N	2	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.125262+00	2026-05-11 11:40:49.125263+00
9725dd7c-161f-4a0c-b881-1dc9215c4570	pravin.gorde@dypiu.ac.in	2025-2026	standard	B5(a). Patents (IPR)	\N	1	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.55346+00	2026-05-11 13:14:03.553465+00
87cb61f9-7dc3-4a2a-b310-5dba8b6cc6d7	pravin.gorde@dypiu.ac.in	2025-2026	standard	B5(a). Patents (IPR)	\N	2	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.553477+00	2026-05-11 13:14:03.553479+00
a6708528-25d5-4ccf-921a-1778463108ca	samarthgangji2405@gmail.com	2025-2026	standard	B5(a). Patents (IPR)	\N	1	a	aa	\N	1010-10-10	a	a	3	\N	\N	\N	\N	2026-05-12 04:49:02.109642+00	2026-05-12 04:49:02.109646+00
f9cb969b-4ce4-4b96-9503-5da2295005ac	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B5(a). Patents (IPR)	\N	1	Solar Lamp	National	\N	2026-04-01	Granted	1234	30	30	30	30	\N	2026-05-11 11:51:53.80442+00	2026-05-12 04:56:59.745212+00
d1f5ade9-b80e-4618-b0cd-2ab65092a5fb	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B5(a). Patents (IPR)	\N	2	\N	\N	\N	\N	\N	\N	0	30	30	30	\N	2026-05-11 11:51:53.810232+00	2026-05-12 04:56:59.745212+00
45799a23-e345-42e6-9a25-ce381c35c2ee	ram.kunwer@dypiu.ac.in	2025-2026	standard	B5(a). Patents (IPR)	\N	1	\N	\N	\N	\N	\N	\N	0	\N	0	0	\N	2026-05-11 12:12:53.517571+00	2026-05-12 04:59:00.486352+00
7742ba6c-a44b-4938-be98-323cc3bf12ba	providence2405@gmail.com	2025-2026	standard	B5(a). Patents (IPR)	\N	1	a	a	\N	2020-10-20	a	a	40	\N	40	\N	\N	2026-05-12 05:28:21.226961+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: popular_writings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.popular_writings (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, media, film, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: products_developed; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products_developed (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, details, usage, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
c82d6339-9b67-42ab-b418-1546cd3bc291	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B7(b). Product Developed and Used by Students	\N	1	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.131903+00	2026-05-11 11:40:49.131908+00
af0ced0a-eef5-463f-9d5a-764241f5cf04	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B7(b). Product Developed and Used by Students	\N	2	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.131917+00	2026-05-11 11:40:49.131919+00
1c9984b7-a1b0-4347-80ba-d20c04dad5e0	pravin.gorde@dypiu.ac.in	2025-2026	standard	B7(b). Product Developed and Used by Students	\N	1	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.558927+00	2026-05-11 13:14:03.558932+00
d0b6db8a-b84e-448a-abdc-7cc910c85914	pravin.gorde@dypiu.ac.in	2025-2026	standard	B7(b). Product Developed and Used by Students	\N	2	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.558941+00	2026-05-11 13:14:03.558943+00
9eb4ea5c-cc8d-4bdf-b43d-508d6d503400	samarthgangji2405@gmail.com	2025-2026	standard	B7(b). Product Developed and Used by Students	\N	1	a	a	30	\N	\N	\N	\N	2026-05-12 04:49:02.112615+00	2026-05-12 04:49:02.11262+00
7f32a17a-9914-441b-8a7e-b63594489fa2	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B7(b). Product Developed and Used by Students	\N	1	Website	Faculty	10	10	10	10	\N	2026-05-11 11:51:53.815327+00	2026-05-12 04:56:59.745212+00
5933cac7-6514-4551-bcc9-430e2d241d09	ram.kunwer@dypiu.ac.in	2025-2026	standard	B7(b). Product Developed and Used by Students	\N	1	\N	\N	0	\N	0	0	\N	2026-05-11 12:12:53.525107+00	2026-05-12 04:59:00.486352+00
86114d19-8249-495c-a6ba-18cd47b4580d	providence2405@gmail.com	2025-2026	standard	B7(b). Product Developed and Used by Students	\N	1	a	a	10	\N	10	\N	\N	2026-05-12 05:28:21.232551+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: projects_guided; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects_guided (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, label, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
700863e1-107c-4623-94f3-9937c026c141	tejashri.gulve@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	1	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.004189+00	2026-05-11 11:40:49.004194+00
da937c14-7faa-472a-b52c-bc5e1bdca9f6	tejashri.gulve@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	2	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.004203+00	2026-05-11 11:40:49.004205+00
e40322a3-6573-4474-9b9e-58bbe4bee0af	tejashri.gulve@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	3	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.004212+00	2026-05-11 11:40:49.004213+00
68a30c1a-4074-447d-8f24-9d385bb529bc	tejashri.gulve@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	4	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.004219+00	2026-05-11 11:40:49.004221+00
4b9b6cae-4721-4ae1-b067-c651ec1a2506	pravin.gorde@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	1	Project guided (3/batch)	3	\N	\N	\N	\N	2026-05-11 13:14:03.478948+00	2026-05-11 13:14:03.478952+00
66439c3c-046b-4e3c-8f4b-456046dcf210	pravin.gorde@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	2	Industrial collaboration / Sponsorship (Max 5)	2	\N	\N	\N	\N	2026-05-11 13:14:03.478961+00	2026-05-11 13:14:03.478963+00
94eab1cc-3cbe-4584-a8e8-5eb19bc17b7d	pravin.gorde@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	3	Award received (Max 5 marks)	3	\N	\N	\N	\N	2026-05-11 13:14:03.478969+00	2026-05-11 13:14:03.47897+00
d672dd3b-9c74-44a7-8297-7896ac729ac3	pravin.gorde@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	4	Project outcome: events/publications (Max 5)	2	\N	\N	\N	\N	2026-05-11 13:14:03.478976+00	2026-05-11 13:14:03.478978+00
754c9341-9f49-4427-8b5c-4d617c535f96	samarthgangji2405@gmail.com	2025-2026	standard	A4. Projects	\N	1	\N	0	\N	\N	\N	\N	2026-05-12 04:49:02.060592+00	2026-05-12 04:49:02.060597+00
6452d6fb-21ff-43a2-bff4-3b2acec72daa	sunil.dambhare@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	1	\N	0	0	0	0	\N	2026-05-11 11:51:53.712859+00	2026-05-12 04:56:59.745212+00
1eb27ae8-132d-4159-835b-1c7a3951fab0	sunil.dambhare@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	2	\N	0	0	0	0	\N	2026-05-11 11:51:53.712872+00	2026-05-12 04:56:59.745212+00
b8b73b28-69a8-4ef9-ac55-e3ed8d9df9ba	sunil.dambhare@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	3	\N	0	0	0	0	\N	2026-05-11 11:51:53.712881+00	2026-05-12 04:56:59.745212+00
d7df4a6b-47fa-4e65-bf7b-4d36eba761fb	sunil.dambhare@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	4	\N	0	0	0	0	\N	2026-05-11 11:51:53.71289+00	2026-05-12 04:56:59.745212+00
a86ef9c4-ea80-44e8-b0a9-0c66c752614a	ram.kunwer@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	1	Project guided (3/batch)	3	\N	7	11	\N	2026-05-11 12:12:53.430102+00	2026-05-12 04:59:00.486352+00
88827172-47a3-41a8-84b0-c01d37842cab	ram.kunwer@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	2	Industrial collaboration / Sponsorship (Max 5)	2	\N	7	11	\N	2026-05-11 12:12:53.430119+00	2026-05-12 04:59:00.486352+00
f296544f-3c18-4dc4-9dd3-fbbeb5b0776e	ram.kunwer@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	3	Award received (Max 5 marks)	3	\N	7	11	\N	2026-05-11 12:12:53.430129+00	2026-05-12 04:59:00.486352+00
39803436-2c43-4624-9d16-6a8a1aea97a1	ram.kunwer@dypiu.ac.in	2025-2026	standard	A4. Projects	\N	4	Project outcome: events/publications (Max 5)	2	\N	7	11	\N	2026-05-11 12:12:53.430138+00	2026-05-12 04:59:00.486352+00
d9276562-09f2-4210-8c56-27fd934fdcaf	providence2405@gmail.com	2025-2026	standard	A4. Projects	\N	1	\N	0	\N	0	\N	\N	2026-05-12 05:28:21.144225+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: qualification_enhancement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.qualification_enhancement (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, label, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
6922e01c-f6ad-4c8e-a5d5-c1843afc835f	tejashri.gulve@dypiu.ac.in	2025-2026	standard	A5. Qualification Enhancement	\N	1	Higher Qualification achieved (5 Marks)	5	\N	\N	\N	\N	2026-05-11 11:40:49.010781+00	2026-05-11 11:40:49.010785+00
c17cae61-7a2c-4444-b6c8-0a9c3799b12f	tejashri.gulve@dypiu.ac.in	2025-2026	standard	A5. Qualification Enhancement	\N	2	Add-on Qualification / Certification (Max 5)	5	\N	\N	\N	\N	2026-05-11 11:40:49.010794+00	2026-05-11 11:40:49.010796+00
859c6d38-54d3-4209-a53b-f6b7ad428e6b	pravin.gorde@dypiu.ac.in	2025-2026	standard	A5. Qualification Enhancement	\N	1	Higher Qualification achieved (5 Marks)	5	\N	\N	\N	\N	2026-05-11 13:14:03.481886+00	2026-05-11 13:14:03.481889+00
fc3f0014-2ca2-4c9b-9582-8a533b854777	pravin.gorde@dypiu.ac.in	2025-2026	standard	A5. Qualification Enhancement	\N	2	Add-on Qualification / Certification (Max 5)	5	\N	\N	\N	\N	2026-05-11 13:14:03.481897+00	2026-05-11 13:14:03.481898+00
951116a3-8bb4-4fb2-b0b6-82e35ff2cc7f	samarthgangji2405@gmail.com	2025-2026	standard	A5. Qualification Enhancement	\N	1	a	2	\N	\N	\N	\N	2026-05-12 04:49:02.066363+00	2026-05-12 04:49:02.066368+00
058d4a94-23c9-471f-889c-386dd875774a	sunil.dambhare@dypiu.ac.in	2025-2026	standard	A5. Qualification Enhancement	\N	1	Higher Qualification achieved (5 Marks)	0	0	0	0	\N	2026-05-11 11:51:53.718436+00	2026-05-12 04:56:59.745212+00
c289c704-ff5a-4eb8-a32f-154d48be7d31	ram.kunwer@dypiu.ac.in	2025-2026	standard	A5. Qualification Enhancement	\N	1	Higher Qualification achieved (5 Marks)	0	\N	0	0	\N	2026-05-11 12:12:53.438214+00	2026-05-12 04:59:00.486352+00
e7d6968f-bafd-485c-ac0b-00f9c25483c7	providence2405@gmail.com	2025-2026	standard	A5. Qualification Enhancement	\N	1	a	5	\N	4.5	\N	\N	2026-05-12 05:28:21.14999+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: research_guidance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.research_guidance (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, degree, student_name, thesis, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
7d9988ac-36f8-47a0-8c87-2a6302bb7fe4	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B4(a). Research Guidance - PhD / PG	\N	1	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.138494+00	2026-05-11 11:40:49.138499+00
2c8d7030-03bb-4bca-ae6c-db34aa617b1e	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B4(a). Research Guidance - PhD / PG	\N	2	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.138508+00	2026-05-11 11:40:49.138509+00
94903c31-7aac-4618-91d2-a6c4d902a296	pravin.gorde@dypiu.ac.in	2025-2026	standard	B4(a). Research Guidance - PhD / PG	\N	1	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.564095+00	2026-05-11 13:14:03.564099+00
5387611e-da0d-4ebf-a6d4-20906f435456	pravin.gorde@dypiu.ac.in	2025-2026	standard	B4(a). Research Guidance - PhD / PG	\N	2	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.564108+00	2026-05-11 13:14:03.56411+00
52628920-605c-4305-a917-3ec0ff0b12e0	samarthgangji2405@gmail.com	2025-2026	standard	B4(a). Research Guidance - PhD / PG	\N	1	\N	\N	\N	0	\N	\N	\N	\N	2026-05-12 04:49:02.116783+00	2026-05-12 04:49:02.11679+00
156425ac-bafc-4052-98b8-ce5240fcda64	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B4(a). Research Guidance - PhD / PG	\N	1	\N	\N	\N	0	0	0	0	\N	2026-05-11 11:51:53.82019+00	2026-05-12 04:56:59.745212+00
f99d5771-7507-40f3-b9ea-30efec361b1b	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B4(a). Research Guidance - PhD / PG	\N	2	\N	\N	\N	0	0	0	0	\N	2026-05-11 11:51:53.820203+00	2026-05-12 04:56:59.745212+00
977638bf-eea1-4b80-bf06-e3dfe0732b5d	ram.kunwer@dypiu.ac.in	2025-2026	standard	B4(a). Research Guidance - PhD / PG	\N	1	PhD	Nikhil Kumar	Thermal Energy Storage	20	\N	0	40	\N	2026-05-11 12:12:53.532709+00	2026-05-12 04:59:00.486352+00
397f0587-ea30-48e7-bf42-7f18b268d63a	ram.kunwer@dypiu.ac.in	2025-2026	standard	B4(a). Research Guidance - PhD / PG	\N	2	PhD	Praveen Kumar	WLB	20	\N	0	40	\N	2026-05-11 12:12:53.532744+00	2026-05-12 04:59:00.486352+00
9cbdf76d-dab0-40d5-ae29-a231335f252b	providence2405@gmail.com	2025-2026	standard	B4(a). Research Guidance - PhD / PG	\N	1	\N	\N	\N	0	\N	0	\N	\N	2026-05-12 05:28:21.237792+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: research_projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.research_projects (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, title, agency, sanction_date, amount, role, project_status, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
a6412116-e9b0-4ad8-b872-761d4b4b75fe	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B4(b). Research / Consultancy Internal Projects	\N	1	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.145505+00	2026-05-11 11:40:49.145509+00
4d04afee-8d18-464b-89cf-157be1bcf981	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B4(b). Research / Consultancy Internal Projects	\N	2	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.145518+00	2026-05-11 11:40:49.14552+00
d0ead3e6-13ff-4b2e-a885-a9adae52d9c0	pravin.gorde@dypiu.ac.in	2025-2026	standard	B4(b). Research / Consultancy Internal Projects	\N	1	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.566894+00	2026-05-11 13:14:03.566901+00
58e62bd2-4f5d-4c65-8992-5fe2e6e05ac0	pravin.gorde@dypiu.ac.in	2025-2026	standard	B4(b). Research / Consultancy Internal Projects	\N	2	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.566922+00	2026-05-11 13:14:03.566924+00
902c91c5-6c9c-4712-bb3d-021c372c6d0e	samarthgangji2405@gmail.com	2025-2026	standard	B4(b). Research / Consultancy Internal Projects	\N	1	a	a	1010-10-10	100000	a	a	3	\N	\N	\N	\N	2026-05-12 04:49:02.122394+00	2026-05-12 04:49:02.122399+00
224c6a7c-d9da-40e4-8800-025c77e5f525	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B4(b). Research / Consultancy Internal Projects	\N	1	Spray Materia	DYPIU	2026-03-01	1000000	CO-PI	Ongoing	10	10	10	9	\N	2026-05-11 11:51:53.825665+00	2026-05-12 04:56:59.745212+00
9c951eff-e5f0-4bb6-b779-067d1e4c441e	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B4(b). Research / Consultancy Internal Projects	\N	2	\N	\N	\N	\N	\N	\N	0	10	10	9	\N	2026-05-11 11:51:53.8317+00	2026-05-12 04:56:59.745212+00
cfd5abb0-d10d-45de-8b6a-ece7a9cc09ac	ram.kunwer@dypiu.ac.in	2025-2026	standard	B4(b). Research / Consultancy Internal Projects	\N	1	\N	\N	\N	\N	\N	\N	0	\N	0	0	\N	2026-05-11 12:12:53.539304+00	2026-05-12 04:59:00.486352+00
20423bb0-ee33-4a04-bd8e-344d247fdcd2	providence2405@gmail.com	2025-2026	standard	B4(b). Research / Consultancy Internal Projects	\N	1	\N	\N	\N	\N	\N	\N	0	\N	0	\N	\N	2026-05-12 05:28:21.246084+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: research_proposals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.research_proposals (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, title, duration, agency, amount, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
df62c0d4-6baa-4c97-9a52-d81769500672	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B7(a). Submitted Research Proposals	\N	1	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.152203+00	2026-05-11 11:40:49.152208+00
dad0fba8-00db-406a-93bf-8821937d4694	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B7(a). Submitted Research Proposals	\N	2	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.152218+00	2026-05-11 11:40:49.15222+00
67af42c0-ec87-418f-8d1b-66e6338020c6	pravin.gorde@dypiu.ac.in	2025-2026	standard	B7(a). Submitted Research Proposals	\N	1	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.571661+00	2026-05-11 13:14:03.571666+00
7f1e227b-5152-4e67-b20e-2b6cbb153729	pravin.gorde@dypiu.ac.in	2025-2026	standard	B7(a). Submitted Research Proposals	\N	2	\N	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.571675+00	2026-05-11 13:14:03.571676+00
82cf24cf-dac1-434a-a9d7-b1bc3dee8fdb	samarthgangji2405@gmail.com	2025-2026	standard	B7(a). Submitted Research Proposals	\N	1	a	a	a	10000	3	\N	\N	\N	\N	2026-05-12 04:49:02.125244+00	2026-05-12 04:49:02.125249+00
7052e7f8-877a-4576-bebc-bc33757c833a	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B7(a). Submitted Research Proposals	\N	1	Spary	2 Years	ANRF	5900000	10	10	10	10	\N	2026-05-11 11:51:53.835071+00	2026-05-12 04:56:59.745212+00
88024181-a1ba-466b-be92-8215d40b243d	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B7(a). Submitted Research Proposals	\N	2	\N	\N	\N	\N	0	10	10	10	\N	2026-05-11 11:51:53.840505+00	2026-05-12 04:56:59.745212+00
9c22760b-b3fb-4492-8096-8a818b254438	ram.kunwer@dypiu.ac.in	2025-2026	standard	B7(a). Submitted Research Proposals	\N	1	Research Proposal	2	Maharashtra	2000000	10	\N	10	10	\N	2026-05-11 12:12:53.545369+00	2026-05-12 04:59:00.486352+00
8e880526-c183-4e74-b927-c6fde8a2efaf	providence2405@gmail.com	2025-2026	standard	B7(a). Submitted Research Proposals	\N	1	a	a	a	10000	10	\N	10	\N	\N	2026-05-12 05:28:21.251669+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: self_development; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.self_development (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, program, duration, organization, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
f32e8715-8cc7-4491-b3da-30abddb25eb3	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B8(a). FDP / Workshops	\N	1	FDP	5	PCCOE	5	\N	\N	\N	\N	2026-05-11 11:40:49.160261+00	2026-05-11 11:40:49.160265+00
b157a42c-d99b-414a-8839-86700cae7d33	tejashri.gulve@dypiu.ac.in	2025-2026	standard	B8(a). FDP / Workshops	\N	2	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.165508+00	2026-05-11 11:40:49.165513+00
13e3ec42-4441-456a-b6e8-6316831c989d	pravin.gorde@dypiu.ac.in	2025-2026	standard	B8(a). FDP / Workshops	\N	1	FDP	5 days	DYPIEMR	5	\N	\N	\N	\N	2026-05-11 13:14:03.576343+00	2026-05-11 13:14:03.576347+00
f5e9b560-0ccc-4033-859b-2ddce5f32c40	pravin.gorde@dypiu.ac.in	2025-2026	standard	B8(a). FDP / Workshops	\N	2	\N	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.580671+00	2026-05-11 13:14:03.580675+00
59a823ac-80e8-4c71-bccc-ab9e0e4c910f	samarthgangji2405@gmail.com	2025-2026	standard	B8(a). FDP / Workshops	\N	1	a	a	aa	3	\N	\N	\N	\N	2026-05-12 04:49:02.128022+00	2026-05-12 04:49:02.128027+00
3411f60e-eaac-4b4e-8cd3-d53ee535b451	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B8(a). FDP / Workshops	\N	1	FDP 1	1 week	DYPIU	5	10	10	10	\N	2026-05-11 11:51:53.843974+00	2026-05-12 04:56:59.745212+00
457e7bfc-e025-4cb0-bef0-5a982fb7cf90	sunil.dambhare@dypiu.ac.in	2025-2026	standard	B8(a). FDP / Workshops	\N	2	FDP 2	1 week	DYPIU	5	10	10	10	\N	2026-05-11 11:51:53.843986+00	2026-05-12 04:56:59.745212+00
98bcae57-686f-48d3-be10-ccbb20c4572e	ram.kunwer@dypiu.ac.in	2025-2026	standard	B8(a). FDP / Workshops	\N	1	FDP1	5	DYPIU	5	\N	10	10	\N	2026-05-11 12:12:53.551113+00	2026-05-12 04:59:00.486352+00
47447392-bb26-4dc3-88d2-12f7f1f018d4	ram.kunwer@dypiu.ac.in	2025-2026	standard	B8(a). FDP / Workshops	\N	2	FDP2	5	DYPIU	5	\N	10	10	\N	2026-05-11 12:12:53.551128+00	2026-05-12 04:59:00.486352+00
c11f143a-7886-4317-bb09-a7d779be6c8a	providence2405@gmail.com	2025-2026	standard	B8(a). FDP / Workshops	\N	1	a	aa	a	5	\N	5	\N	\N	2026-05-12 05:28:21.257381+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: social_contributions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.social_contributions (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, activity, status, details, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
d9f5cdec-52de-4f74-bfd5-dcb77fe6f84a	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	1	Induction Program	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.017053+00	2026-05-11 11:40:49.017058+00
cfb6f012-c8a3-4b91-8512-c19f0bbb0218	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	2	Unnat Bharat Abhiyan	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.017067+00	2026-05-11 11:40:49.017069+00
71a80250-75d3-49db-9b80-4714ff12e73a	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	3	Yoga Classes	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.017077+00	2026-05-11 11:40:49.017229+00
e2f1ddbf-0fcf-4f43-bb74-ab0adedf35a8	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	4	Blood Donation	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.017242+00	2026-05-11 11:40:49.017243+00
bb3d24d1-53ac-4e42-8d07-7160984351da	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	5	Techno Social activities	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.01725+00	2026-05-11 11:40:49.017251+00
d1f2c4a0-5d4f-4034-9ac8-79ba6f2ccf8f	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	6	NSS	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.017257+00	2026-05-11 11:40:49.017259+00
628b82f0-7be0-4cae-a96f-c401f355eaf9	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	7	Social visits	\N	visit	5	\N	\N	\N	\N	2026-05-11 11:40:49.024041+00	2026-05-11 11:40:49.024046+00
a5d6feff-d7ea-4211-9542-dd4a178796a5	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	8	Project of Social Impact	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.028634+00	2026-05-11 11:40:49.028638+00
f74f7f95-77bd-4522-b432-4050fa97140e	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	9	Any other activity	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.028647+00	2026-05-11 11:40:49.028649+00
ee2bf128-5329-46f6-8ec9-d1537cf2e945	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	1	Induction Program	\N	Coordinator	5	5	5	5	\N	2026-05-11 11:51:53.72317+00	2026-05-12 04:56:59.745212+00
975195d2-59b2-47e0-a294-5a4216868eb3	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	2	Unnat Bharat Abhiyan	\N	\N	0	5	5	5	\N	2026-05-11 11:51:53.728084+00	2026-05-12 04:56:59.745212+00
70605ab7-d033-4599-9037-7815dc62d625	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	3	Yoga Classes	\N	\N	0	5	5	5	\N	2026-05-11 11:51:53.728161+00	2026-05-12 04:56:59.745212+00
b8a6371e-3488-4472-a088-af83e49fea9b	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	4	Blood Donation	\N	\N	0	5	5	5	\N	2026-05-11 11:51:53.728171+00	2026-05-12 04:56:59.745212+00
2baef2b9-133f-4633-a533-ae0ceccc532f	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	5	Techno Social activities	\N	\N	0	5	5	5	\N	2026-05-11 11:51:53.728179+00	2026-05-12 04:56:59.745212+00
00325466-7c4a-40e0-9cff-a107fece2d08	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	6	NSS	\N	\N	0	5	5	5	\N	2026-05-11 11:51:53.728187+00	2026-05-12 04:56:59.745212+00
642b17a3-eca9-4a7e-ba3d-c69a5e132614	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	7	Social visits	\N	\N	0	5	5	5	\N	2026-05-11 11:51:53.728195+00	2026-05-12 04:56:59.745212+00
7f464db7-f994-4057-af2a-7215b3ab1e1f	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	8	Project of Social Impact	\N	\N	0	5	5	5	\N	2026-05-11 11:51:53.728205+00	2026-05-12 04:56:59.745212+00
ee0dc87e-b889-4220-a17e-06b94d482bc2	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	9	Any other activity	\N	\N	0	5	5	5	\N	2026-05-11 11:51:53.728213+00	2026-05-12 04:56:59.745212+00
9f04cfbf-ba63-4072-a42a-ddc7fbe4cc46	ram.kunwer@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	1	\N	\N	NA	0	\N	0	0	\N	2026-05-11 12:12:53.444467+00	2026-05-12 04:59:00.486352+00
98306f7a-89fe-496b-b517-233b1bb4e438	pravin.gorde@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	1	Induction Program	\N	FY	5	\N	\N	\N	\N	2026-05-11 13:14:03.487921+00	2026-05-11 13:14:03.487925+00
5e09efea-4654-4ba6-9cc5-b3319fb59ea6	pravin.gorde@dypiu.ac.in	2025-2026	standard	Contribution to Society	\N	2	Unnat Bharat Abhiyan	\N	SY	5	\N	\N	\N	\N	2026-05-11 13:14:03.487934+00	2026-05-11 13:14:03.487935+00
09a32545-1b07-4c41-8461-3eec9fa0df73	samarthgangji2405@gmail.com	2025-2026	standard	Contribution to Society	\N	1	a	\N	a	3	\N	\N	\N	\N	2026-05-12 04:49:02.069289+00	2026-05-12 04:49:02.069293+00
2b62a8dc-2db8-4365-9cdb-065ac6859ee1	providence2405@gmail.com	2025-2026	standard	Contribution to Society	\N	1	\N	\N	\N	0	\N	0	\N	\N	2026-05-12 05:28:21.155212+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: student_feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_feedback (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, course_code, feedback_1, feedback_2, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
2c91d11e-6746-4853-b932-ca05f3183ea5	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Student Feedback	\N	1	Structural Analysis	100	100	10	\N	\N	\N	\N	2026-05-11 11:40:49.034573+00	2026-05-11 11:40:49.034578+00
fcb229d3-870a-46f3-bcf3-b0e0da61a2ac	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Student Feedback	\N	2	\N	0	0	0	\N	\N	\N	\N	2026-05-11 11:40:49.039831+00	2026-05-11 11:40:49.039834+00
11a6a98d-7651-47e5-8858-308da82f59f9	tejashri.gulve@dypiu.ac.in	2025-2026	standard	Student Feedback	\N	3	\N	0	0	0	\N	\N	\N	\N	2026-05-11 11:40:49.039843+00	2026-05-11 11:40:49.039845+00
826250af-cefe-4ac9-9813-8b9cfa0e81f6	pravin.gorde@dypiu.ac.in	2025-2026	standard	Student Feedback	\N	1	FY	8	8	0.8000000000000000444089209850062616169452667236328125	\N	\N	\N	\N	2026-05-11 13:14:03.493305+00	2026-05-11 13:14:03.493313+00
38a65869-38a2-4550-b939-84e2d09c4bb4	samarthgangji2405@gmail.com	2025-2026	standard	Student Feedback	\N	1	a	56	56	5.5999999999999996447286321199499070644378662109375	\N	\N	\N	\N	2026-05-12 04:49:02.072308+00	2026-05-12 04:49:02.072314+00
e501266e-ce1f-40be-a7f1-d0ffedcbd707	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Student Feedback	\N	1	Computational Techniques	78	82	8	17	17	17	\N	2026-05-11 11:51:53.735057+00	2026-05-12 04:56:59.745212+00
d317701c-90e7-4a6d-a120-6446c16ada29	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Student Feedback	\N	2	Fluid Mechanics	82	85	8.300000000000000710542735760100185871124267578125	17	17	17	\N	2026-05-11 11:51:53.73507+00	2026-05-12 04:56:59.745212+00
6314398e-daf9-4a8a-9fc8-c02a3e3549c2	sunil.dambhare@dypiu.ac.in	2025-2026	standard	Student Feedback	\N	3	\N	0	0	0	17	17	17	\N	2026-05-11 11:51:53.740937+00	2026-05-12 04:56:59.745212+00
ee23fb8b-319b-4a60-bb3e-124d9d3cfdd3	ram.kunwer@dypiu.ac.in	2025-2026	standard	Student Feedback	\N	1	Vehicle Dynamics	80	80	8	\N	24	24	\N	2026-05-11 12:12:53.451762+00	2026-05-12 04:59:00.486352+00
5f10cc66-0da1-4215-81ab-73dd22f85db2	ram.kunwer@dypiu.ac.in	2025-2026	standard	Student Feedback	\N	2	Advanced Manufacturing	80	80	8	\N	24	24	\N	2026-05-11 12:12:53.451802+00	2026-05-12 04:59:00.486352+00
2253314b-dca1-45f2-9c3d-a11b49365874	ram.kunwer@dypiu.ac.in	2025-2026	standard	Student Feedback	\N	3	FEM	80	80	8	\N	24	24	\N	2026-05-11 12:12:53.451811+00	2026-05-12 04:59:00.486352+00
2c49ffce-67bf-4e62-b93d-0a26121231c5	providence2405@gmail.com	2025-2026	standard	Student Feedback	\N	1	a	96	87	9.199999999999999289457264239899814128875732421875	\N	8	\N	\N	2026-05-12 05:28:21.160434+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: teaching_process; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teaching_process (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, semester, course_code, planned_classes, conducted_classes, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
d1781701-439b-45d9-8b44-5e021724414a	tejashri.gulve@dypiu.ac.in	2025-2026	standard	A1. Lectures / Tutorials / Practicals	\N	1	IV	ECE2101T/ Structural Analysis	48	49	25	\N	\N	\N	\N	2026-05-11 11:40:49.046426+00	2026-05-11 11:40:49.046431+00
78856ce0-34ef-4e3c-83b1-b08d9faf0659	tejashri.gulve@dypiu.ac.in	2025-2026	standard	A1. Lectures / Tutorials / Practicals	\N	2	\N	\N	0	0	0	\N	\N	\N	\N	2026-05-11 11:40:49.052758+00	2026-05-11 11:40:49.052763+00
0ebd6d82-aa2f-4c1c-aa06-b1c9d48372d0	tejashri.gulve@dypiu.ac.in	2025-2026	standard	A1. Lectures / Tutorials / Practicals	\N	3	\N	\N	0	0	0	\N	\N	\N	\N	2026-05-11 11:40:49.052783+00	2026-05-11 11:40:49.052785+00
8050554f-5159-420d-a1f9-7b38c2a8d43d	pravin.gorde@dypiu.ac.in	2025-2026	standard	A1. Lectures / Tutorials / Practicals	\N	1	I	BCCE	35	35	50	\N	\N	\N	\N	2026-05-11 13:14:03.495837+00	2026-05-11 13:14:03.495841+00
f329f089-1c0a-4e87-a069-796c4d5fb70e	samarthgangji2405@gmail.com	2025-2026	standard	A1. Lectures / Tutorials / Practicals	\N	1	a	a	2	2	2	\N	\N	\N	\N	2026-05-12 04:49:02.077395+00	2026-05-12 04:49:02.0774+00
d92e863d-b48f-4200-b0a6-a64d800a262d	sunil.dambhare@dypiu.ac.in	2025-2026	standard	A1. Lectures / Tutorials / Practicals	\N	1	TY B Tech V	Computational Techniques	36	38	50	98	100	90	\N	2026-05-11 11:51:53.746746+00	2026-05-12 04:56:59.745212+00
b86ebd9a-50c0-4216-83e4-e1908b710b02	sunil.dambhare@dypiu.ac.in	2025-2026	standard	A1. Lectures / Tutorials / Practicals	\N	2	SY B Tech III	Fluid Machinery	36	37	50	98	100	90	\N	2026-05-11 11:51:53.746764+00	2026-05-12 04:56:59.745212+00
90d787cf-1de8-4a17-aded-e17350e0b54e	ram.kunwer@dypiu.ac.in	2025-2026	standard	A1. Lectures / Tutorials / Practicals	\N	1	VI	Advanced Manufacturing Processes	30	30	50	\N	90	100	\N	2026-05-11 12:12:53.458274+00	2026-05-12 04:59:00.486352+00
0a34c4b7-3c6f-4bfa-856a-248bc8579522	ram.kunwer@dypiu.ac.in	2025-2026	standard	A1. Lectures / Tutorials / Practicals	\N	2	II	Vehicle Dynamics	30	30	50	\N	90	100	\N	2026-05-11 12:12:53.458289+00	2026-05-12 04:59:00.486352+00
0383b4f1-7cdf-4a82-aee5-7dd860edf9ea	providence2405@gmail.com	2025-2026	standard	A1. Lectures / Tutorials / Practicals	\N	1	a	a	30	30	50	\N	30	\N	\N	2026-05-12 05:28:21.165866+00	2026-05-12 05:32:07.378122+00
\.


--
-- Data for Name: university_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.university_activities (id, faculty_email, academic_year, form_family, section_title, max_marks, row_no, activity, nature, score, hod_score, director_score, dean_score, vc_score, created_at, updated_at) FROM stdin;
e4538ed9-f1f2-490c-a919-f2b4e9de1629	tejashri.gulve@dypiu.ac.in	2025-2026	standard	University Level Activities	\N	1	School Level	Summit 2026	30	\N	\N	\N	\N	2026-05-11 11:40:49.05916+00	2026-05-11 11:40:49.059173+00
5717cf7f-f3e6-4ad9-8bc7-2089c3ddc50c	tejashri.gulve@dypiu.ac.in	2025-2026	standard	University Level Activities	\N	2	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.064862+00	2026-05-11 11:40:49.064867+00
0cf6c650-691c-4c34-a363-d6609f962c31	tejashri.gulve@dypiu.ac.in	2025-2026	standard	University Level Activities	\N	3	\N	\N	0	\N	\N	\N	\N	2026-05-11 11:40:49.064876+00	2026-05-11 11:40:49.064877+00
363ee499-7afd-49e1-8997-732aa38ec6e7	pravin.gorde@dypiu.ac.in	2025-2026	standard	University Level Activities	\N	1	HOD	2 semester	30	\N	\N	\N	\N	2026-05-11 13:14:03.500535+00	2026-05-11 13:14:03.50054+00
124d6040-b894-4f58-8fc7-083ad73ab463	pravin.gorde@dypiu.ac.in	2025-2026	standard	University Level Activities	\N	2	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.502963+00	2026-05-11 13:14:03.502967+00
b30046fe-6c56-4cf3-8ed3-a9f8f41f35ea	pravin.gorde@dypiu.ac.in	2025-2026	standard	University Level Activities	\N	3	\N	\N	0	\N	\N	\N	\N	2026-05-11 13:14:03.502975+00	2026-05-11 13:14:03.502977+00
b72c22f8-8fd6-4077-99ef-70c71cb4902d	samarthgangji2405@gmail.com	2025-2026	standard	University Level Activities	\N	1	a	a	3	\N	\N	\N	\N	2026-05-12 04:49:02.082429+00	2026-05-12 04:49:02.082434+00
621ec918-7697-492f-95b3-52174e20b557	sunil.dambhare@dypiu.ac.in	2025-2026	standard	University Level Activities	\N	1	Director IQAC	Full Time	30	55	55	50	\N	2026-05-11 11:51:53.752801+00	2026-05-12 04:56:59.745212+00
b9f0b973-3950-4930-8733-4d3cc6c200a6	sunil.dambhare@dypiu.ac.in	2025-2026	standard	University Level Activities	\N	2	SAE Coordinator	Year Long	25	55	55	50	\N	2026-05-11 11:51:53.752814+00	2026-05-12 04:56:59.745212+00
9c7c6ad8-979c-4110-904b-e4ad458d9ca3	sunil.dambhare@dypiu.ac.in	2025-2026	standard	University Level Activities	\N	3	\N	\N	0	55	55	50	\N	2026-05-11 11:51:53.758485+00	2026-05-12 04:56:59.745212+00
50a64f89-9d98-4e72-9172-1fb1fdc94a1c	ram.kunwer@dypiu.ac.in	2025-2026	standard	University Level Activities	\N	1	NAAC	University	30	\N	30	30	\N	2026-05-11 12:12:53.464501+00	2026-05-12 04:59:00.486352+00
b0b80ead-4f14-4078-ad8f-4af6281558df	providence2405@gmail.com	2025-2026	standard	University Level Activities	\N	1	a	a	30	\N	30	\N	\N	2026-05-12 05:28:21.171507+00	2026-05-12 05:32:07.378122+00
\.


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.announcements_id_seq', 1, true);


--
-- Name: appraisal_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.appraisal_config_id_seq', 1, false);


--
-- Name: acr_scores acr_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acr_scores
    ADD CONSTRAINT acr_scores_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: appraisal_config appraisal_config_academic_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_config
    ADD CONSTRAINT appraisal_config_academic_year_key UNIQUE (academic_year);


--
-- Name: appraisal_config appraisal_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_config
    ADD CONSTRAINT appraisal_config_pkey PRIMARY KEY (id);


--
-- Name: appraisal_documents appraisal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_documents
    ADD CONSTRAINT appraisal_documents_pkey PRIMARY KEY (id);


--
-- Name: appraisal_reviews appraisal_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_reviews
    ADD CONSTRAINT appraisal_reviews_pkey PRIMARY KEY (id);


--
-- Name: appraisal_reviews appraisal_reviews_unique_reviewer; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_reviews
    ADD CONSTRAINT appraisal_reviews_unique_reviewer UNIQUE (faculty_email, academic_year, reviewer_role);


--
-- Name: appraisal_snapshots appraisal_snapshots_faculty_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_snapshots
    ADD CONSTRAINT appraisal_snapshots_faculty_year_key UNIQUE (faculty_email, academic_year);


--
-- Name: appraisal_snapshots appraisal_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appraisal_snapshots
    ADD CONSTRAINT appraisal_snapshots_pkey PRIMARY KEY (id);


--
-- Name: awards awards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.awards
    ADD CONSTRAINT awards_pkey PRIMARY KEY (id);


--
-- Name: book_publications book_publications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_publications
    ADD CONSTRAINT book_publications_pkey PRIMARY KEY (id);


--
-- Name: conferences conferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conferences
    ADD CONSTRAINT conferences_pkey PRIMARY KEY (id);


--
-- Name: course_files course_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_files
    ADD CONSTRAINT course_files_pkey PRIMARY KEY (id);


--
-- Name: declarations declarations_faculty_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declarations
    ADD CONSTRAINT declarations_faculty_year_key UNIQUE (faculty_email, academic_year);


--
-- Name: declarations declarations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declarations
    ADD CONSTRAINT declarations_pkey PRIMARY KEY (id);


--
-- Name: department_activities department_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_activities
    ADD CONSTRAINT department_activities_pkey PRIMARY KEY (id);


--
-- Name: external_research_projects external_research_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_research_projects
    ADD CONSTRAINT external_research_projects_pkey PRIMARY KEY (id);


--
-- Name: faculty_profiles faculty_profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_profiles
    ADD CONSTRAINT faculty_profiles_email_key UNIQUE (email);


--
-- Name: faculty_profiles faculty_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_profiles
    ADD CONSTRAINT faculty_profiles_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: form_section_definitions form_section_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_section_definitions
    ADD CONSTRAINT form_section_definitions_pkey PRIMARY KEY (code);


--
-- Name: form_section_definitions form_section_definitions_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_section_definitions
    ADD CONSTRAINT form_section_definitions_unique UNIQUE (form_family, title, max_marks);


--
-- Name: ict_pedagogy ict_pedagogy_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ict_pedagogy
    ADD CONSTRAINT ict_pedagogy_pkey PRIMARY KEY (id);


--
-- Name: industrial_training industrial_training_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.industrial_training
    ADD CONSTRAINT industrial_training_pkey PRIMARY KEY (id);


--
-- Name: industry_connect industry_connect_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.industry_connect
    ADD CONSTRAINT industry_connect_pkey PRIMARY KEY (id);


--
-- Name: innovative_teaching innovative_teaching_faculty_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.innovative_teaching
    ADD CONSTRAINT innovative_teaching_faculty_year_key UNIQUE (faculty_email, academic_year);


--
-- Name: innovative_teaching innovative_teaching_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.innovative_teaching
    ADD CONSTRAINT innovative_teaching_pkey PRIMARY KEY (id);


--
-- Name: ipr_records ipr_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ipr_records
    ADD CONSTRAINT ipr_records_pkey PRIMARY KEY (id);


--
-- Name: journal_publications journal_publications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_publications
    ADD CONSTRAINT journal_publications_pkey PRIMARY KEY (id);


--
-- Name: module_config module_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_config
    ADD CONSTRAINT module_config_pkey PRIMARY KEY (id);


--
-- Name: non_teaching_appraisals non_teaching_appraisals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.non_teaching_appraisals
    ADD CONSTRAINT non_teaching_appraisals_pkey PRIMARY KEY (id);


--
-- Name: non_teaching_appraisals non_teaching_appraisals_staff_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.non_teaching_appraisals
    ADD CONSTRAINT non_teaching_appraisals_staff_year_key UNIQUE (staff_email, academic_year);


--
-- Name: non_teaching_part_a_items non_teaching_part_a_items_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.non_teaching_part_a_items
    ADD CONSTRAINT non_teaching_part_a_items_key UNIQUE (staff_email, academic_year, item_key);


--
-- Name: non_teaching_part_a_items non_teaching_part_a_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.non_teaching_part_a_items
    ADD CONSTRAINT non_teaching_part_a_items_pkey PRIMARY KEY (id);


--
-- Name: non_teaching_part_b_ratings non_teaching_part_b_ratings_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.non_teaching_part_b_ratings
    ADD CONSTRAINT non_teaching_part_b_ratings_key UNIQUE (staff_email, academic_year, section_key, parameter_no);


--
-- Name: non_teaching_part_b_ratings non_teaching_part_b_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.non_teaching_part_b_ratings
    ADD CONSTRAINT non_teaching_part_b_ratings_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: patents patents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patents
    ADD CONSTRAINT patents_pkey PRIMARY KEY (id);


--
-- Name: popular_writings popular_writings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.popular_writings
    ADD CONSTRAINT popular_writings_pkey PRIMARY KEY (id);


--
-- Name: products_developed products_developed_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products_developed
    ADD CONSTRAINT products_developed_pkey PRIMARY KEY (id);


--
-- Name: projects_guided projects_guided_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects_guided
    ADD CONSTRAINT projects_guided_pkey PRIMARY KEY (id);


--
-- Name: qualification_enhancement qualification_enhancement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qualification_enhancement
    ADD CONSTRAINT qualification_enhancement_pkey PRIMARY KEY (id);


--
-- Name: research_guidance research_guidance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_guidance
    ADD CONSTRAINT research_guidance_pkey PRIMARY KEY (id);


--
-- Name: research_projects research_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_projects
    ADD CONSTRAINT research_projects_pkey PRIMARY KEY (id);


--
-- Name: research_proposals research_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_proposals
    ADD CONSTRAINT research_proposals_pkey PRIMARY KEY (id);


--
-- Name: self_development self_development_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_development
    ADD CONSTRAINT self_development_pkey PRIMARY KEY (id);


--
-- Name: social_contributions social_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_contributions
    ADD CONSTRAINT social_contributions_pkey PRIMARY KEY (id);


--
-- Name: student_feedback student_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_feedback
    ADD CONSTRAINT student_feedback_pkey PRIMARY KEY (id);


--
-- Name: teaching_process teaching_process_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teaching_process
    ADD CONSTRAINT teaching_process_pkey PRIMARY KEY (id);


--
-- Name: university_activities university_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.university_activities
    ADD CONSTRAINT university_activities_pkey PRIMARY KEY (id);


--
-- Name: acr_scores_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX acr_scores_faculty_year_idx ON public.acr_scores USING btree (faculty_email, academic_year);


--
-- Name: appraisal_documents_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appraisal_documents_faculty_year_idx ON public.appraisal_documents USING btree (faculty_email, academic_year);


--
-- Name: appraisal_reviews_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appraisal_reviews_faculty_year_idx ON public.appraisal_reviews USING btree (faculty_email, academic_year);


--
-- Name: awards_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX awards_faculty_year_idx ON public.awards USING btree (faculty_email, academic_year);


--
-- Name: book_publications_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX book_publications_faculty_year_idx ON public.book_publications USING btree (faculty_email, academic_year);


--
-- Name: conferences_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conferences_faculty_year_idx ON public.conferences USING btree (faculty_email, academic_year);


--
-- Name: course_files_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_files_faculty_year_idx ON public.course_files USING btree (faculty_email, academic_year);


--
-- Name: declarations_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX declarations_faculty_year_idx ON public.declarations USING btree (faculty_email, academic_year);


--
-- Name: department_activities_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX department_activities_faculty_year_idx ON public.department_activities USING btree (faculty_email, academic_year);


--
-- Name: external_research_projects_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX external_research_projects_faculty_year_idx ON public.external_research_projects USING btree (faculty_email, academic_year);


--
-- Name: faculty_profiles_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX faculty_profiles_role_idx ON public.faculty_profiles USING btree (appraisal_role);


--
-- Name: faculty_profiles_school_department_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX faculty_profiles_school_department_idx ON public.faculty_profiles USING btree (school, department);


--
-- Name: form_section_definitions_family_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_section_definitions_family_idx ON public.form_section_definitions USING btree (form_family, part);


--
-- Name: ict_pedagogy_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ict_pedagogy_faculty_year_idx ON public.ict_pedagogy USING btree (faculty_email, academic_year);


--
-- Name: idx_announcements_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_is_active ON public.announcements USING btree (is_active);


--
-- Name: idx_appraisal_config_academic_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appraisal_config_academic_year ON public.appraisal_config USING btree (academic_year);


--
-- Name: idx_appraisal_reviews_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appraisal_reviews_year ON public.appraisal_reviews USING btree (academic_year);


--
-- Name: idx_declarations_academic_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_declarations_academic_year ON public.declarations USING btree (academic_year);


--
-- Name: idx_declarations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_declarations_status ON public.declarations USING btree (status);


--
-- Name: idx_faculty_profiles_school; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faculty_profiles_school ON public.faculty_profiles USING btree (school);


--
-- Name: idx_feedback_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_category ON public.feedback USING btree (category);


--
-- Name: idx_feedback_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_status ON public.feedback USING btree (status);


--
-- Name: idx_feedback_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_submitted ON public.feedback USING btree (submitted_at DESC);


--
-- Name: industrial_training_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX industrial_training_faculty_year_idx ON public.industrial_training USING btree (faculty_email, academic_year);


--
-- Name: industry_connect_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX industry_connect_faculty_year_idx ON public.industry_connect USING btree (faculty_email, academic_year);


--
-- Name: innovative_teaching_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX innovative_teaching_faculty_year_idx ON public.innovative_teaching USING btree (faculty_email, academic_year);


--
-- Name: ipr_records_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ipr_records_faculty_year_idx ON public.ipr_records USING btree (faculty_email, academic_year);


--
-- Name: journal_publications_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX journal_publications_faculty_year_idx ON public.journal_publications USING btree (faculty_email, academic_year);


--
-- Name: non_teaching_appraisals_staff_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX non_teaching_appraisals_staff_year_idx ON public.non_teaching_appraisals USING btree (staff_email, academic_year);


--
-- Name: non_teaching_appraisals_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX non_teaching_appraisals_status_idx ON public.non_teaching_appraisals USING btree (status, academic_year);


--
-- Name: non_teaching_part_a_items_staff_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX non_teaching_part_a_items_staff_year_idx ON public.non_teaching_part_a_items USING btree (staff_email, academic_year);


--
-- Name: non_teaching_part_b_ratings_staff_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX non_teaching_part_b_ratings_staff_year_idx ON public.non_teaching_part_b_ratings USING btree (staff_email, academic_year);


--
-- Name: password_reset_tokens_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_tokens_email_idx ON public.password_reset_tokens USING btree (email);


--
-- Name: password_reset_tokens_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_tokens_expires_idx ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: patents_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patents_faculty_year_idx ON public.patents USING btree (faculty_email, academic_year);


--
-- Name: popular_writings_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX popular_writings_faculty_year_idx ON public.popular_writings USING btree (faculty_email, academic_year);


--
-- Name: products_developed_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_developed_faculty_year_idx ON public.products_developed USING btree (faculty_email, academic_year);


--
-- Name: projects_guided_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_guided_faculty_year_idx ON public.projects_guided USING btree (faculty_email, academic_year);


--
-- Name: qualification_enhancement_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX qualification_enhancement_faculty_year_idx ON public.qualification_enhancement USING btree (faculty_email, academic_year);


--
-- Name: research_guidance_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX research_guidance_faculty_year_idx ON public.research_guidance USING btree (faculty_email, academic_year);


--
-- Name: research_projects_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX research_projects_faculty_year_idx ON public.research_projects USING btree (faculty_email, academic_year);


--
-- Name: research_proposals_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX research_proposals_faculty_year_idx ON public.research_proposals USING btree (faculty_email, academic_year);


--
-- Name: self_development_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX self_development_faculty_year_idx ON public.self_development USING btree (faculty_email, academic_year);


--
-- Name: social_contributions_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX social_contributions_faculty_year_idx ON public.social_contributions USING btree (faculty_email, academic_year);


--
-- Name: student_feedback_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_feedback_faculty_year_idx ON public.student_feedback USING btree (faculty_email, academic_year);


--
-- Name: teaching_process_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX teaching_process_faculty_year_idx ON public.teaching_process USING btree (faculty_email, academic_year);


--
-- Name: university_activities_faculty_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX university_activities_faculty_year_idx ON public.university_activities USING btree (faculty_email, academic_year);


--
-- Name: acr_scores acr_scores_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER acr_scores_set_updated_at BEFORE UPDATE ON public.acr_scores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: announcements announcements_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER announcements_set_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: appraisal_config appraisal_config_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER appraisal_config_set_updated_at BEFORE UPDATE ON public.appraisal_config FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: appraisal_documents appraisal_documents_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER appraisal_documents_set_updated_at BEFORE UPDATE ON public.appraisal_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: appraisal_reviews appraisal_reviews_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER appraisal_reviews_set_updated_at BEFORE UPDATE ON public.appraisal_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: appraisal_snapshots appraisal_snapshots_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER appraisal_snapshots_set_updated_at BEFORE UPDATE ON public.appraisal_snapshots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: awards awards_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER awards_set_updated_at BEFORE UPDATE ON public.awards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: book_publications book_publications_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER book_publications_set_updated_at BEFORE UPDATE ON public.book_publications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: conferences conferences_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER conferences_set_updated_at BEFORE UPDATE ON public.conferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: course_files course_files_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER course_files_set_updated_at BEFORE UPDATE ON public.course_files FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: declarations declarations_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER declarations_set_updated_at BEFORE UPDATE ON public.declarations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: department_activities department_activities_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER department_activities_set_updated_at BEFORE UPDATE ON public.department_activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: external_research_projects external_research_projects_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER external_research_projects_set_updated_at BEFORE UPDATE ON public.external_research_projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: faculty_profiles faculty_profiles_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER faculty_profiles_set_updated_at BEFORE UPDATE ON public.faculty_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: feedback feedback_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER feedback_set_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: form_section_definitions form_section_definitions_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER form_section_definitions_set_updated_at BEFORE UPDATE ON public.form_section_definitions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ict_pedagogy ict_pedagogy_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ict_pedagogy_set_updated_at BEFORE UPDATE ON public.ict_pedagogy FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: industrial_training industrial_training_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER industrial_training_set_updated_at BEFORE UPDATE ON public.industrial_training FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: industry_connect industry_connect_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER industry_connect_set_updated_at BEFORE UPDATE ON public.industry_connect FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: innovative_teaching innovative_teaching_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER innovative_teaching_set_updated_at BEFORE UPDATE ON public.innovative_teaching FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ipr_records ipr_records_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ipr_records_set_updated_at BEFORE UPDATE ON public.ipr_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: journal_publications journal_publications_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER journal_publications_set_updated_at BEFORE UPDATE ON public.journal_publications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: module_config module_config_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER module_config_set_updated_at BEFORE UPDATE ON public.module_config FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: non_teaching_appraisals non_teaching_appraisals_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER non_teaching_appraisals_set_updated_at BEFORE UPDATE ON public.non_teaching_appraisals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: non_teaching_part_a_items non_teaching_part_a_items_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER non_teaching_part_a_items_set_updated_at BEFORE UPDATE ON public.non_teaching_part_a_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: non_teaching_part_b_ratings non_teaching_part_b_ratings_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER non_teaching_part_b_ratings_set_updated_at BEFORE UPDATE ON public.non_teaching_part_b_ratings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patents patents_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER patents_set_updated_at BEFORE UPDATE ON public.patents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: popular_writings popular_writings_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER popular_writings_set_updated_at BEFORE UPDATE ON public.popular_writings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: products_developed products_developed_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER products_developed_set_updated_at BEFORE UPDATE ON public.products_developed FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: projects_guided projects_guided_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER projects_guided_set_updated_at BEFORE UPDATE ON public.projects_guided FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: qualification_enhancement qualification_enhancement_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER qualification_enhancement_set_updated_at BEFORE UPDATE ON public.qualification_enhancement FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: research_guidance research_guidance_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER research_guidance_set_updated_at BEFORE UPDATE ON public.research_guidance FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: research_projects research_projects_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER research_projects_set_updated_at BEFORE UPDATE ON public.research_projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: research_proposals research_proposals_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER research_proposals_set_updated_at BEFORE UPDATE ON public.research_proposals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: self_development self_development_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER self_development_set_updated_at BEFORE UPDATE ON public.self_development FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: social_contributions social_contributions_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER social_contributions_set_updated_at BEFORE UPDATE ON public.social_contributions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: student_feedback student_feedback_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER student_feedback_set_updated_at BEFORE UPDATE ON public.student_feedback FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: teaching_process teaching_process_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER teaching_process_set_updated_at BEFORE UPDATE ON public.teaching_process FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: university_activities university_activities_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER university_activities_set_updated_at BEFORE UPDATE ON public.university_activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE app_user IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES TO app_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE app_user IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO app_user;


--
-- PostgreSQL database dump complete
--

\unrestrict RongQzAmqMKSptBE8wGTGtsanUeD0x15OcfV5FzjffPBcolXPNM0Sh5FGHMghTs


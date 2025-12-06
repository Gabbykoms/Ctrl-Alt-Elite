-- ============================================
-- 0. CLEANUP (Avoid conflicts)
-- ============================================
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.rides CASCADE;
DROP TABLE IF EXISTS public.shuttles CASCADE;
DROP TABLE IF EXISTS public.route_stops CASCADE;
DROP TABLE IF EXISTS public.routes CASCADE;
DROP TABLE IF EXISTS public.stops CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;    -- Dropping the conflicting table
DROP TABLE IF EXISTS public.profiles CASCADE; -- Dropping any old attempts

-- ============================================
-- 1. ENABLE EXTENSIONS & PERMISSIONS (CRITICAL FIX)
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- FIX: Grant access to the schema so the app can actually read/write
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================
-- 2. PROFILES TABLE (Renamed from 'users')
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Link directly to Auth ID
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('student', 'driver', 'admin')) DEFAULT 'student',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- ============================================
-- 3. STUDENTS TABLE
-- ============================================
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  student_id VARCHAR(50),
  grade_level VARCHAR(50),
  school VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE -- Updated Ref
);

-- ============================================
-- 4. DRIVERS TABLE
-- ============================================
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  license_number VARCHAR(50),
  phone VARCHAR(20),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INTEGER,
  vehicle_plate VARCHAR(50),
  is_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE -- Updated Ref
);

-- ============================================
-- 5. STOPS & ROUTES (Standard Setup)
-- ============================================
CREATE TABLE public.stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  distance DECIMAL(10, 2),
  duration INTEGER,
  frequency INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE public.route_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL,
  stop_id UUID NOT NULL,
  stop_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES public.stops(id) ON DELETE CASCADE,
  UNIQUE(route_id, stop_id)
);

-- ============================================
-- 6. SHUTTLES TABLE
-- ============================================
CREATE TABLE public.shuttles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  vehicle_number VARCHAR(50),
  capacity INTEGER NOT NULL DEFAULT 20,
  current_passengers INTEGER DEFAULT 0,
  status VARCHAR(50) CHECK (status IN ('active', 'offline', 'maintenance')) DEFAULT 'offline',
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  last_location_update TIMESTAMP WITH TIME ZONE,
  assigned_driver_id UUID,
  assigned_route_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  FOREIGN KEY (assigned_driver_id) REFERENCES public.drivers(user_id), -- Keeps linking to driver
  FOREIGN KEY (assigned_route_id) REFERENCES public.routes(id)
);

-- ============================================
-- 7. RIDES TABLE
-- ============================================
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL,
  shuttle_id UUID,
  start_stop_id UUID,
  end_stop_id UUID,
  pickup_latitude DECIMAL(10, 8) NOT NULL,
  pickup_longitude DECIMAL(11, 8) NOT NULL,
  dropoff_latitude DECIMAL(10, 8) NOT NULL,
  dropoff_longitude DECIMAL(11, 8) NOT NULL,
  pickup_address TEXT,
  dropoff_address TEXT,
  status VARCHAR(50) CHECK (status IN ('requested', 'confirmed', 'driver_assigned', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled')) DEFAULT 'requested',
  estimated_pickup_time INTEGER,
  estimated_arrival_time INTEGER,
  actual_pickup_time TIMESTAMP WITH TIME ZONE,
  actual_dropoff_time TIMESTAMP WITH TIME ZONE,
  passenger_count INTEGER DEFAULT 1,
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE, -- Updated Ref
  FOREIGN KEY (shuttle_id) REFERENCES public.shuttles(id),
  FOREIGN KEY (start_stop_id) REFERENCES public.stops(id),
  FOREIGN KEY (end_stop_id) REFERENCES public.stops(id)
);

-- ============================================
-- 8. SHIFTS TABLE
-- ============================================
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL,
  shuttle_id UUID,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  clock_out TIMESTAMP WITH TIME ZONE,
  hours_worked DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  FOREIGN KEY (driver_id) REFERENCES public.drivers(user_id) ON DELETE CASCADE,
  FOREIGN KEY (shuttle_id) REFERENCES public.shuttles(id)
);

-- ============================================
-- 9. GRANT PERMISSIONS TO ALL TABLES (MUST BE AFTER TABLE CREATION)
-- ============================================
-- This is critical: Grant permissions AFTER tables are created
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================
-- 10. SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shuttles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Note: service_role bypasses RLS automatically, these are for anon/authenticated
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Basic Read Policies for other tables
CREATE POLICY "All can read stops" ON public.stops FOR SELECT USING (TRUE);
CREATE POLICY "All can read routes" ON public.routes FOR SELECT USING (TRUE);
CREATE POLICY "All can read shuttles" ON public.shuttles FOR SELECT USING (TRUE);
CREATE POLICY "All can read drivers" ON public.drivers FOR SELECT USING (TRUE);
CREATE POLICY "All can read rides" ON public.rides FOR SELECT USING (TRUE);
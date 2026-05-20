-- ============================
-- STRONG SUPLEMENTOS — SCHEMA
-- ============================

-- Users (extends Supabase auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('owner', 'seller'))
);

-- Products
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product variants (each has own price/stock)
CREATE TABLE public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Único',
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fixed combos
CREATE TABLE public.combos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Combo components
CREATE TABLE public.combo_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_id UUID REFERENCES public.combos(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- Clients
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales
CREATE TABLE public.sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  seller_id UUID REFERENCES public.users(id) NOT NULL,
  delivered_by TEXT NOT NULL DEFAULT 'pocho' CHECK (delivered_by IN ('pocho', 'owner')),
  has_delivery BOOLEAN NOT NULL DEFAULT FALSE,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale items
CREATE TABLE public.sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id),
  combo_id UUID REFERENCES public.combos(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_combo BOOLEAN NOT NULL DEFAULT FALSE,
  combo_group_id UUID,
  combo_price NUMERIC(10,2)
);

-- Deliveries
CREATE TABLE public.deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  schedule TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  client_name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'ida' CHECK (type IN ('ida', 'ida_y_vuelta')),
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Commission records (one per item/group per sale)
CREATE TABLE public.commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person TEXT NOT NULL CHECK (person IN ('pri', 'pocho')),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission payment batches (for history)
CREATE TABLE public.commission_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person TEXT NOT NULL CHECK (person IN ('pri', 'pocho')),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App settings (key-value)
CREATE TABLE public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL DEFAULT ''
);

-- Default settings
INSERT INTO public.settings (key, value) VALUES
  ('pocho_whatsapp_group', ''),
  ('cadete_whatsapp_number', ''),
  ('commission_pri_product', '2000'),
  ('commission_pri_combo', '2500'),
  ('commission_pocho', '1000');

-- ============================
-- STOCK DECREMENT FUNCTION
-- ============================
CREATE OR REPLACE FUNCTION public.decrement_stock(variant_id UUID, qty INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.product_variants
  SET stock = stock - qty
  WHERE id = variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- STOCK RESTORE FUNCTION (for sale cancellation)
-- ============================
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    UPDATE public.product_variants pv
    SET stock = stock + si.quantity
    FROM public.sale_items si
    WHERE si.sale_id = NEW.id AND si.variant_id = pv.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_restore_stock
  AFTER UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_cancel();

-- ============================
-- ROW LEVEL SECURITY
-- ============================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Owner: full access to everything
CREATE POLICY "owner_all" ON public.users FOR ALL USING (get_my_role() = 'owner');
CREATE POLICY "owner_all" ON public.products FOR ALL USING (get_my_role() = 'owner');
CREATE POLICY "owner_all" ON public.product_variants FOR ALL USING (get_my_role() = 'owner');
CREATE POLICY "owner_all" ON public.combos FOR ALL USING (get_my_role() = 'owner');
CREATE POLICY "owner_all" ON public.combo_items FOR ALL USING (get_my_role() = 'owner');
CREATE POLICY "owner_all" ON public.clients FOR ALL USING (get_my_role() = 'owner');
CREATE POLICY "owner_all" ON public.sales FOR ALL USING (get_my_role() = 'owner');
CREATE POLICY "owner_all" ON public.sale_items FOR ALL USING (get_my_role() = 'owner');
CREATE POLICY "owner_all" ON public.deliveries FOR ALL USING (get_my_role() = 'owner');
CREATE POLICY "owner_all" ON public.commissions FOR ALL USING (get_my_role() = 'owner');
CREATE POLICY "owner_all" ON public.commission_payments FOR ALL USING (get_my_role() = 'owner');
CREATE POLICY "owner_all" ON public.settings FOR ALL USING (get_my_role() = 'owner');

-- Seller (Pri): limited access
-- Can read products/variants (need them for sales) but NOT cost_price — handle in app
CREATE POLICY "seller_read_products" ON public.products FOR SELECT USING (get_my_role() = 'seller');
CREATE POLICY "seller_read_variants" ON public.product_variants FOR SELECT USING (get_my_role() = 'seller');
CREATE POLICY "seller_read_combos" ON public.combos FOR SELECT USING (get_my_role() = 'seller');
CREATE POLICY "seller_read_combo_items" ON public.combo_items FOR SELECT USING (get_my_role() = 'seller');
-- Sellers can read/write clients
CREATE POLICY "seller_all_clients" ON public.clients FOR ALL USING (get_my_role() = 'seller');
-- Sellers can read/insert own sales
CREATE POLICY "seller_read_sales" ON public.sales FOR SELECT USING (get_my_role() = 'seller' AND seller_id = auth.uid());
CREATE POLICY "seller_insert_sales" ON public.sales FOR INSERT WITH CHECK (get_my_role() = 'seller');
CREATE POLICY "seller_update_sales" ON public.sales FOR UPDATE USING (get_my_role() = 'seller' AND seller_id = auth.uid());
CREATE POLICY "seller_all_sale_items" ON public.sale_items FOR ALL USING (get_my_role() = 'seller');
CREATE POLICY "seller_all_deliveries" ON public.deliveries FOR ALL USING (get_my_role() = 'seller');
-- Sellers can only see their own commissions
CREATE POLICY "seller_own_commissions" ON public.commissions FOR ALL USING (get_my_role() = 'seller' AND person = 'pri');
-- Sellers can insert commissions (needed during sale creation)
CREATE POLICY "seller_insert_commissions" ON public.commissions FOR INSERT WITH CHECK (get_my_role() = 'seller');
-- Sellers can read settings (need WA links)
CREATE POLICY "seller_read_settings" ON public.settings FOR SELECT USING (get_my_role() = 'seller');
-- Sellers can read their own user profile
CREATE POLICY "seller_own_user" ON public.users FOR SELECT USING (id = auth.uid());

-- ============================
-- REALTIME
-- ============================
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sale_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.commissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;

-- Helper function to find auth user id by email (used in Ajustes for seller setup)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email TEXT)
RETURNS UUID AS $$
  SELECT id FROM auth.users WHERE email = $1 LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

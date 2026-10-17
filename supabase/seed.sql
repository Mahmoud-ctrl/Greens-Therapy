-- Dummy catalogue and clinic hours for development / demos.
-- Run in the Supabase SQL editor (runs as the postgres role, so RLS does not apply).
-- Each block only inserts into an empty table, so re-running it is a no-op.

begin;

insert into public.treatments (name_en, name_ar, description_en, description_ar, price, duration_minutes, category)
select * from (values
    ('Cupping therapy', 'العلاج بالحجامة',
     'Traditional cupping to improve circulation, release muscle tension, and support the flow of energy through the body.',
     'حجامة تقليدية لتحسين الدورة الدموية وإرخاء العضلات ودعم تدفق الطاقة في الجسم.',
     40.00, 45, 'Cupping'),
    ('Chinese massage', 'التدليك الصيني',
     'A deep, rhythmic Tui Na massage that works acupressure points to ease pain and restore balance.',
     'تدليك "توي نا" عميق وإيقاعي يعمل على نقاط الضغط لتخفيف الألم واستعادة التوازن.',
     50.00, 60, 'Massage'),
    ('Dry needling', 'العلاج بالإبر الجافة',
     'Fine needles target trigger points to relieve chronic muscle pain and improve mobility.',
     'إبر رفيعة تستهدف نقاط الألم لتخفيف آلام العضلات المزمنة وتحسين الحركة.',
     45.00, 45, 'Dry needling'),
    ('Holistic healing session', 'جلسة الشفاء الشامل',
     'A combined session of cupping, massage, and breathing guidance tailored to your body and mind.',
     'جلسة متكاملة تجمع الحجامة والتدليك وتمارين التنفس، مصممة لجسدك وعقلك.',
     70.00, 90, 'Holistic'),
    ('Back & shoulder relief', 'راحة الظهر والكتفين',
     'A focused massage and cupping treatment for desk-bound tension in the back, neck, and shoulders.',
     'جلسة مركزة من التدليك والحجامة لتوتر الظهر والرقبة والكتفين الناتج عن الجلوس الطويل.',
     35.00, 30, 'Massage')
) as seed(name_en, name_ar, description_en, description_ar, price, duration_minutes, category)
where not exists (select 1 from public.treatments);

with inserted as (
    insert into public.products (name_en, name_ar, description_en, description_ar, price, category, weight)
    select name_en, name_ar, description_en, description_ar, price, category, weight from (values
        ('Raw mountain honey', 'عسل جبلي خام',
         'Unfiltered wildflower honey harvested from our hives in the mountains.',
         'عسل أزهار برية غير مصفّى من خلايانا في الجبال.',
         18.00, 'Honey', '500 g', 24),
        ('Raw mountain honey — large', 'عسل جبلي خام — كبير',
         'Our signature wildflower honey in a family-size jar.',
         'عسلنا المميز من الأزهار البرية في عبوة عائلية.',
         32.00, 'Honey', '1 kg', 12),
        ('Oak honey', 'عسل السنديان',
         'Dark, rich honeydew honey with a deep, malty flavour.',
         'عسل داكن وغني بنكهة عميقة.',
         25.00, 'Honey', '500 g', 8),
        ('Natural honeycomb', 'شمع العسل الطبيعي',
         'A whole piece of comb honey, straight from the frame.',
         'قطعة كاملة من شمع العسل كما هي من الإطار.',
         22.00, 'Hive products', '350 g', 6),
        ('Bee pollen', 'حبوب لقاح النحل',
         'Sun-dried pollen granules, rich in protein and vitamins.',
         'حبيبات لقاح مجففة بالشمس وغنية بالبروتين والفيتامينات.',
         15.00, 'Hive products', '250 g', 15),
        ('Propolis tincture', 'صبغة العكبر',
         'Propolis extract to support immunity and soothe sore throats.',
         'خلاصة العكبر لدعم المناعة وتهدئة التهاب الحلق.',
         12.00, 'Hive products', '30 ml', 0)
    ) as seed(name_en, name_ar, description_en, description_ar, price, category, weight, initial_stock)
    where not exists (select 1 from public.products)
    returning id, name_en
)
-- Stock is recorded through inventory so the apply_inventory_quantity_delta trigger keeps products.stock_quantity in sync.
insert into public.inventory (product_id, quantity_delta, reason)
select inserted.id, stock.initial_stock, 'Initial stock (seed)'
from inserted
join (values
    ('Raw mountain honey', 24),
    ('Raw mountain honey — large', 12),
    ('Oak honey', 8),
    ('Natural honeycomb', 6),
    ('Bee pollen', 15)
) as stock(name_en, initial_stock) on stock.name_en = inserted.name_en;

-- Monday–Saturday, 09:00–18:00, 30-minute slots (0 = Sunday).
insert into public.clinic_settings (id, working_days, start_time, end_time, slot_interval_minutes)
values (true, '{1,2,3,4,5,6}', '09:00', '18:00', 30)
on conflict (id) do nothing;

commit;

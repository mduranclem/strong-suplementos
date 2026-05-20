import { createClient } from '@supabase/supabase-js'

const url = 'https://cczfhuyefbvgexmxwtjl.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjemZodXllZmJ2Z2V4bXh3dGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTM4OTUsImV4cCI6MjA5NDg2OTg5NX0.e4JiqXW7dtfTp5Rcr1bpndv_nejuFRMjY8pXiFJEavg'

export const supabase = createClient(url, key)

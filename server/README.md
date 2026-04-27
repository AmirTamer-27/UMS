Local helper removed.

The project previously included a small local helper server for service-role inserts. Per request,
this has been removed/neutralized. Use Supabase policies and authentication to enable client-side writes,
or run a secure backend in your infrastructure if you need service-role operations.

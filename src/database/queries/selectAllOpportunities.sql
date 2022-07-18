select id,
     created_at,
     title
from opportunities
order by id
offset 0
fetch next 10000 rows only;

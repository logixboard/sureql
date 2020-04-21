-- selectUsingTwoOfSameKey
SELECT mt.blah_id
FROM   public.mytable mt
WHERE  mt.customer_id = :'customerId'
UNION
SELECT ot.blah_id
FROM   public.othertable ot
WHERE  ot.customer_id = :'customerId'
ORDER BY blah_id
;

-- selectUsingTwoDisparateKeys
SELECT mt.blah_id
FROM   public.mytable mt
WHERE  mt.customer_id = :'customerId'
AND    mt.date_of_purchase < :'dateOfPurchase'
;

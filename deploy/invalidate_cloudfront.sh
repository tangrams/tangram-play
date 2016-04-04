#!/bin/bash

aws configure set preview.cloudfront true
aws cloudfront create-invalidation --distribution-id E357GQRWTZYF8E --invalidation-batch '{"Paths":{"Quantity":1,"Items":["/tangram/play/*"]},"CallerReference":"'$(date +%s)'"}'
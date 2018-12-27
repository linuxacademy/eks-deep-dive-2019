#!/usr/bin/env bash

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

TRUST="{ \"Version\": \"2012-10-17\", \"Statement\": [ { \"Effect\": \"Allow\", \"Principal\": { \"AWS\": \"arn:aws:iam::$ACCOUNT_ID:root\" }, \"Action\": \"sts:AssumeRole\" } ] }"

TEMP='/tmp/iam-role-policy'

echo '{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": "eks:Describe*", "Resource": "*" } ] }' > $TEMP

ROLE='EKSDeepDiveCodeBuildKubectlRole'
POLICY='eks-describe'

aws iam create-role --role-name $ROLE --assume-role-policy-document "$TRUST" --output text --query 'Role.Arn'

aws iam get-role --role-name $ROLE --output table

aws iam put-role-policy --role-name $ROLE --policy-name $POLICY --policy-document file://$TEMP

aws iam get-role-policy --role-name $ROLE --policy-name $POLICY --output table

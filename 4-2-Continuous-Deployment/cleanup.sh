#!/usr/bin/env bash

ROLE='EKSDeepDiveCodeBuildKubectlRole'

aws iam delete-role-policy --role-name $ROLE --policy-name eks-describe
aws iam delete-role --role-name $ROLE
kubectl delete deployments hello-k8s
kubectl delete services hello-k8s

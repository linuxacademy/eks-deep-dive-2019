#!/usr/bin/env bash

# Update the security groups for both worker node groups so that they can
# communicate with each other.

oldNodes="<old_node_CFN_stack_name>" # EDIT HERE
newNodes="<new_node_CFN_stack_name>" # EDIT HERE

#---DO NOT EDIT BELOW THIS LINE---#

echo "Old node group CF stack: $oldNodes"
echo "New node group CF stack: $newNodes"

oldSecGroup=$(aws cloudformation describe-stack-resources --stack-name $oldNodes \
--query 'StackResources[?ResourceType==`AWS::EC2::SecurityGroup`].PhysicalResourceId' \
--output text)

echo "Old node group SG: $oldSecGroup"

newSecGroup=$(aws cloudformation describe-stack-resources --stack-name $newNodes \
--query 'StackResources[?ResourceType==`AWS::EC2::SecurityGroup`].PhysicalResourceId' \
--output text)

echo "New node group SG: $newSecGroup"

echo "Revoking ingress rule from $oldSecGroup, removing $newSecGroup"

aws ec2 revoke-security-group-ingress --group-id $oldSecGroup \
--source-group $newSecGroup --protocol -1

echo "Revoking ingress rule from $newSecGroup, removing $oldSecGroup"

aws ec2 revoke-security-group-ingress --group-id $newSecGroup \
--source-group $oldSecGroup --protocol -1
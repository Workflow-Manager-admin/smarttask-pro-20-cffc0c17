#!/bin/bash
cd /home/kavia/workspace/code-generation/smarttask-pro-20-cffc0c17/smarttask_pro
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


NOW=$(date +"%H-%M-%S-%m-%d-%Y")
OUTFILE="./log/$NOW.log"

printf "********************************************\n\n" 2>&1 | tee -a $OUTFILE
printf "Server started at $NOW\n" 2>&1 | tee -a $OUTFILE
node server.js 2>&1 | tee -a $OUTFILE
printf "Server stopped at $(date +"%H-%M-%S-%m-%d-%Y")\n\n********************************************\n" 2>&1 | tee -a $OUTFILE
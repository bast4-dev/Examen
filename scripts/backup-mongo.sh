#!/bin/bash
# Sauvegarde des bases MongoDB de préproduction et de production (à lancer sur le serveur, par cron).
#   Installation : crontab -e  puis
#   0 3 * * * $HOME/exam1/scripts/backup-mongo.sh >> $HOME/backups/exam1/backup.log 2>&1
#
# Restauration d'une sauvegarde (remplace le contenu actuel de la base) :
#   docker exec -i exam1-prod-mongo-1 mongorestore --archive --gzip --drop < fichier.archive.gz
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/exam1}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
ENVIRONMENTS="${ENVIRONMENTS:-prod preprod}"

umask 077 # sauvegardes lisibles uniquement par leur propriétaire (elles contiennent des données personnelles)
mkdir -p "$BACKUP_DIR"

for ENV in $ENVIRONMENTS; do
  container="exam1-$ENV-mongo-1"
  file="$BACKUP_DIR/exam1-$ENV-$(date +%F_%H%M).archive.gz"
  docker exec "$container" mongodump --db exam1Db --archive --gzip --quiet > "$file"
  echo "$(date "+%F %T") sauvegarde $ENV OK : $file ($(du -h "$file" | cut -f1))"
done

# Rotation : suppression des sauvegardes de plus de RETENTION_DAYS jours
find "$BACKUP_DIR" -name 'exam1-*.archive.gz' -mtime +"$RETENTION_DAYS" -print -delete

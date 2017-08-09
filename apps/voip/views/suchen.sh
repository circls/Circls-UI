#find ./ -name *.flv

#find ./ -name "*.php" -type f -print0 | xargs -0 grep -i 'poopup'

find ./ -name "*.html" -type f -print0 | xargs -0 grep -i '../i18n'

FROM php:8.2-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libsqlite3-dev \
    && docker-php-ext-install pdo_sqlite \
    && rm -rf /var/lib/apt/lists/*

RUN a2enmod rewrite headers

RUN printf '%s\n' \
    '<Directory /var/www/html/>' \
    'Options FollowSymLinks' \
    'AllowOverride All' \
    'Require all granted' \
    '</Directory>' \
    > /etc/apache2/conf-available/flowbypak.conf \
    && a2enconf flowbypak

# IMPORTANT:
# Repository ke server folder ki files directly Apache root mein copy hongi
COPY server/ /var/www/html/

RUN find /var/www/html -type d -exec chmod 755 {} \; \
    && find /var/www/html -type f -exec chmod 644 {} \;

EXPOSE 80
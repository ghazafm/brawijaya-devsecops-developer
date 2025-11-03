FROM wordpress:latest

COPY docker-entrypoint.sh /usr/local/bin/custom-entrypoint.sh

RUN chmod +x /usr/local/bin/custom-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
CMD ["apache2-foreground"]

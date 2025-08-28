#include <stdio.h>
#include <stdlib.h>
#include <libpq-fe.h>

static void finish_with_error(PGconn *conn) {
    fprintf(stderr, "Error: %s\n", PQerrorMessage(conn));
    if (conn) PQfinish(conn);
    exit(EXIT_FAILURE);
}

int main(void) {
    const char *host = getenv("DB_HOST") ? getenv("DB_HOST") : "localhost";
    const char *port = getenv("DB_PORT") ? getenv("DB_PORT") : "5432";
    const char *user = getenv("DB_USER") ? getenv("DB_USER") : "postgres";
    const char *pass = getenv("DB_PASSWORD") ? getenv("DB_PASSWORD") : "";
    const char *name = getenv("DB_NAME") ? getenv("DB_NAME") : "rules_db";
    const char *table = getenv("RULES_TABLE") ? getenv("RULES_TABLE") : "rules";

    char conninfo[512];
    snprintf(conninfo, sizeof(conninfo),
             "host=%s port=%s user=%s password=%s dbname=%s",
             host, port, user, pass, name);

    PGconn *conn = PQconnectdb(conninfo);
    if (PQstatus(conn) != CONNECTION_OK) finish_with_error(conn);

    char query[256];
    snprintf(query, sizeof(query), "SELECT * FROM %s;", table);

    PGresult *res = PQexec(conn, query);
    if (PQresultStatus(res) != PGRES_TUPLES_OK) {
        fprintf(stderr, "Query failed: %s\n", PQerrorMessage(conn));
        PQclear(res);
        PQfinish(conn);
        return EXIT_FAILURE;
    }

    int nrows = PQntuples(res);
    int ncols = PQnfields(res);

    // Print header
    for (int c = 0; c < ncols; c++) {
        printf("%s%s", PQfname(res, c), (c == ncols - 1) ? "\n" : "\t");
    }

    // Print rows
    for (int r = 0; r < nrows; r++) {
        for (int c = 0; c < ncols; c++) {
            char *val = PQgetisnull(res, r, c) ? "NULL" : PQgetvalue(res, r, c);
            printf("%s%s", val, (c == ncols - 1) ? "\n" : "\t");
        }
    }

    PQclear(res);
    PQfinish(conn);
    return EXIT_SUCCESS;
}

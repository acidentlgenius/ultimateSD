#!/bin/bash
# Start PostgreSQL service or simply skip tests if no database exists
# The problem is E2E needs to build Next.js, and Next.js tries to prerender pages connecting to the database

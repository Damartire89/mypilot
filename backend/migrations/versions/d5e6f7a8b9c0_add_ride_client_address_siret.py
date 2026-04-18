"""add client_address and client_siret on rides

Revision ID: d5e6f7a8b9c0
Revises: c3d4e5f6a7b8
Create Date: 2026-04-17

Ajoute deux champs facultatifs sur rides pour les factures conformes :
- client_address : adresse complète du client
- client_siret : SIRET si le client est une entreprise
"""
from alembic import op
import sqlalchemy as sa

revision = 'd5e6f7a8b9c0'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('rides', sa.Column('client_address', sa.String(length=300), nullable=True))
    op.add_column('rides', sa.Column('client_siret', sa.String(length=14), nullable=True))


def downgrade() -> None:
    op.drop_column('rides', 'client_siret')
    op.drop_column('rides', 'client_address')

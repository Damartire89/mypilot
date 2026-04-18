"""add issued_at on rides (freeze facture)

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-04-18

Ajoute le champ issued_at sur rides.
- Si NULL : la facture n'est pas encore émise (numéro modifiable via Settings).
- Si renseigné : facture émise, numéro figé, settings.invoice_prefix/invoice_next_number
  ne peuvent plus être modifiés tant qu'au moins une facture est émise.
"""
from alembic import op
import sqlalchemy as sa

revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('rides', sa.Column('issued_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('rides', 'issued_at')

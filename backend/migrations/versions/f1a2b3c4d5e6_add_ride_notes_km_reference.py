"""add_ride_notes_km_reference

Revision ID: f1a2b3c4d5e6
Revises: e1f2a3b4c5d6
Create Date: 2026-04-15 10:00:00.000000

Ajout des champs courses :
- notes : remarque libre sur la course
- km_distance : distance en km
- reference : numéro de course auto-généré (PREFIX-YEAR-NNNN)
"""

from alembic import op
import sqlalchemy as sa


revision = 'f1a2b3c4d5e6'
down_revision = 'e1f2a3b4c5d6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('rides', sa.Column('notes', sa.String(500), nullable=True))
    op.add_column('rides', sa.Column('km_distance', sa.Numeric(8, 1), nullable=True))
    op.add_column('rides', sa.Column('reference', sa.String(30), nullable=True))


def downgrade() -> None:
    op.drop_column('rides', 'reference')
    op.drop_column('rides', 'km_distance')
    op.drop_column('rides', 'notes')

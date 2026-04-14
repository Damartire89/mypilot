"""add_fr_specific_fields

Revision ID: e1f2a3b4c5d6
Revises: d4e5f6a7b8c9
Create Date: 2026-04-14 12:00:00.000000

Ajout des champs spécifiques au marché français :
- drivers : carte_pro_expiry, carte_vtc_expiry
- vehicles : ads_expiry, taximetre_expiry
- rides : bon_transport, prescripteur
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Champs chauffeurs FR
    op.add_column('drivers', sa.Column('carte_pro_expiry', sa.Date(), nullable=True))
    op.add_column('drivers', sa.Column('carte_vtc_expiry', sa.Date(), nullable=True))

    # Champs véhicules FR
    op.add_column('vehicles', sa.Column('ads_expiry', sa.Date(), nullable=True))
    op.add_column('vehicles', sa.Column('taximetre_expiry', sa.Date(), nullable=True))

    # Champs courses médicales FR
    op.add_column('rides', sa.Column('bon_transport', sa.String(50), nullable=True))
    op.add_column('rides', sa.Column('prescripteur', sa.String(200), nullable=True))


def downgrade() -> None:
    op.drop_column('rides', 'prescripteur')
    op.drop_column('rides', 'bon_transport')
    op.drop_column('vehicles', 'taximetre_expiry')
    op.drop_column('vehicles', 'ads_expiry')
    op.drop_column('drivers', 'carte_vtc_expiry')
    op.drop_column('drivers', 'carte_pro_expiry')

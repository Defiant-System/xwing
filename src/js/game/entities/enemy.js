
let EntityEnemy = Impact.Entity.extend({
	speed: 0,
	hitTimer: null,
	dead: false,
	angle: 0,
	killScore: 10,
	hitScore: 10,
	children: [],
	parentNode: null,
	nodeOffset: {
		x: 0,
		y: 0
	},
	pivot: {
		x: 0,
		y: 0
	},
	maxVel: {
		x: 1000,
		y: 1000
	},
	explodeParticles: 10,
	attachmentPoints: [],
	soundExplode: new Impact.Sound('media/sounds/explosion.ogg'),
	type: Impact.Entity.TYPE.B,
	checkAgainst: Impact.Entity.TYPE.A,
	killTimerTime: 0.3,
	init: function(x, y, settings) {
		this.parent(x, y, settings);
		this.hitTimer = new Impact.Timer(0);
		this.dieTimer = new Impact.Timer(0);
		this.ownAngle = this.angle;
	},
	angleToPoint: function(x, y) {
		return Math.atan2(y - (this.pos.y + this.size.y / 2), x - (this.pos.x + this.size.x / 2));
	},
	update: function() {
		if (!this.isChild) {
			this.vel.x = Math.cos(this.angle) * this.speed;
			this.vel.y = Math.sin(this.angle) * this.speed;
			this.parent();
			if (this.pos.x < -this.image.width || this.pos.x > Impact.system.width + 10 || this.pos.y > Impact.system.height + 10 || this.pos.y < -this.image.height - 30) {
				this.kill();
			}
		}
	},
	attachChild: function(entityClass) {
		var ap = this.attachmentPoints.shift();
		var c = this.addChild(entityClass, ap.x, ap.y, {
			angle: (ap.angle * Math.PI) / 180
		});
		return c;
	},
	addChild: function(entityClass, x, y, settings) {
		var c = Impact.game.spawnEntity(entityClass, 0, 0, settings);
		c.entityType = entityClass;
		c.nodeOffset.x = x;
		c.nodeOffset.y = y;
		c.isChild = true;
		c.parentNode = this;
		this.children.push(c);
		return c;
	},
	updateChildren: function() {
		if (!this.children.length)
			return;
		var sv = Math.sin(this.angle - Math.PI / 2)
		  , cv = Math.cos(this.angle - Math.PI / 2);
		for (var i = 0; i < this.children.length; i++) {
			var c = this.children[i];
			var cx = c.nodeOffset.x
			  , cy = c.nodeOffset.y;
			c.pos.x = this.pos.x + cv * cx - sv * cy - c.size.x / 2 + this.size.x / 2;
			c.pos.y = this.pos.y + cv * cy + sv * cx - c.size.y / 2 + this.size.y / 2;
			c.angle = this.angle + c.ownAngle;
			c.updateChildren();
		}
	},
	draw: function() {
		var sx = this.image.width / 2
		  , sy = this.image.height / 2;
		Impact.system.context.save();
		Impact.system.context.translate(this.pos.x - Impact.game._rscreen.x - this.offset.x + sx, this.pos.y - Impact.game._rscreen.y - this.offset.y + sy);
		Impact.system.context.rotate(this.angle - Math.PI / 2);
		Impact.system.context.drawImage(this.image.data, -sx, -sy);
		Impact.system.context.restore();
	},
	receiveDamage: function(amount, other) {
		var childTookDamage = false;
		if (this.health <= 10 && this.children.length) {
			for (var i = 0; i < this.children.length; i++) {
				childTookDamage = this.children[i].receiveSilentDamage(amount);
				if (childTookDamage)
					break;
			}
		}
		if (!childTookDamage) {
			this.parent(amount);
		}
		this.hitTimer.set(0.3);
		Impact.game.score += this.hitScore;
		if (this.health <= 0) {
			this.soundExplode.play();
			this.explode();
			Impact.game.lastKillTimer.set(this.killTimerTime);
			Impact.game.score += this.killScore;
		} else {
			var px = other.pos.x - other.size.x / 2;
			var py = other.pos.y - other.size.y / 2;
			Impact.game.spawnEntity(EntityExplosionParticleLargeSlow, px, py, {
				count: 1
			});
		}
	},
	receiveSilentDamage: function(amount) {
		if (this.health <= 10 && this.children.length) {
			for (var i = 0; i < this.children.length; i++) {
				var childTookDamage = this.children[i].receiveSilentDamage(amount);
				if (childTookDamage) {
					return true;
				}
			}
		} else if (this.health > 10) {
			this.health -= amount;
			return true;
		}
		return false;
	},
	explode: function() {
		var px = this.pos.x + this.size.x / 2;
		var py = this.pos.y + this.size.y / 2;
		Impact.game.spawnEntity(EntityExplosionParticleLarge, px, py, {
			count: this.explodeParticles
		});
	},
	kill: function(killedByParent) {
		for (var i = 0; i < this.children.length; i++) {
			this.children[i].explode();
			this.children[i].kill(true);
		}
		if (killedByParent) {
			Impact.game.score += this.killScore;
		}
		if (this.parentNode && !killedByParent) {
			this.parentNode.children.erase(this);
		}
		this.parent();
	},
	check: function(other) {
		if (!other.shieldTimer) {
			other.kill();
			this.kill();
		} else {
			this.receiveDamage(1000, other);
		}
	}
});

let EntityExplosionParticleLarge = EntityParticles.extend({
	lifetime: 1,
	fadetime: 1,
	vel: {
		x: 150,
		y: 150
	},
	image: new Impact.Image('~/sprites/enemy-explosion.png')
});

let EntityExplosionParticleLargeSlow = EntityParticles.extend({
	lifetime: 1,
	fadetime: 1,
	vel: {
		x: 20,
		y: 20
	},
	image: new Impact.Image('~/sprites/enemy-explosion.png')
});

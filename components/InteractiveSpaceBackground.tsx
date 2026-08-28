import React, { useEffect, useRef } from 'react';

export const InteractiveSpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      radius: 200,
      active: false,
    };

    // Nodes array
    interface AudioNode {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      angle: number;
      angleSpeed: number;
      pulseRate: number;
      pulseIntensity: number;
      amplitude: number;
      frequency: number;
    }

    const nodes: AudioNode[] = [];
    const colors = [
      'rgba(6, 182, 212, 0.4)',  // cyan
      'rgba(168, 85, 247, 0.4)', // purple
      'rgba(16, 185, 129, 0.3)', // emerald
      'rgba(245, 158, 11, 0.3)', // amber
    ];

    // Generate network nodes
    const nodeCount = Math.min(40, Math.floor((width * height) / 30000));
    for (let i = 0; i < nodeCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        size: Math.random() * 3 + 2,
        color,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: 0.01 + Math.random() * 0.02,
        pulseRate: 0.02 + Math.random() * 0.03,
        pulseIntensity: 0,
        amplitude: 15 + Math.random() * 25,
        frequency: 0.05 + Math.random() * 0.08,
      });
    }

    // Handle mouse events
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
      mouse.active = false;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse movement interpolation
      if (mouse.active) {
        if (mouse.x === -1000) {
          mouse.x = mouse.targetX;
          mouse.y = mouse.targetY;
        } else {
          mouse.x += (mouse.targetX - mouse.x) * 0.1;
          mouse.y += (mouse.targetY - mouse.y) * 0.1;
        }
      } else {
        mouse.x += (-1000 - mouse.x) * 0.1;
        mouse.y += (-1000 - mouse.y) * 0.1;
      }

      // Draw subtle space grid
      const gridSize = 80;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        for (let y = 0; y < height; y += 10) {
          // Grid gravity deformation based on mouse coordinate
          let dx = x - mouse.x;
          let dy = y - mouse.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          let offsetX = 0;
          
          if (dist < mouse.radius) {
            const force = (1 - dist / mouse.radius) * 12;
            offsetX = (dx / dist) * force;
          }
          
          if (y === 0) {
            ctx.moveTo(x + offsetX, y);
          } else {
            ctx.lineTo(x + offsetX, y);
          }
        }
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 10) {
          let dx = x - mouse.x;
          let dy = y - mouse.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          let offsetY = 0;
          
          if (dist < mouse.radius) {
            const force = (1 - dist / mouse.radius) * 12;
            offsetY = (dy / dist) * force;
          }
          
          if (x === 0) {
            ctx.moveTo(x, y + offsetY);
          } else {
            ctx.lineTo(x, y + offsetY);
          }
        }
        ctx.stroke();
      }

      // Draw active visual links (synapses)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            let alpha = (1 - dist / 150) * 0.12;
            
            // Check if mouse is near the link to light it up
            const midX = (nodes[i].x + nodes[j].x) / 2;
            const midY = (nodes[i].y + nodes[j].y) / 2;
            const mDx = midX - mouse.x;
            const mDy = midY - mouse.y;
            const mDist = Math.sqrt(mDx * mDx + mDy * mDy);

            if (mDist < mouse.radius) {
              const boost = (1 - mDist / mouse.radius) * 0.25;
              alpha += boost;
            }

            // Create a gorgeous gradient connection
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.8 + (alpha * 0.8);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Render nodes & dynamic frequency rings around them
      nodes.forEach((node) => {
        // Update floats
        node.baseX += node.speedX;
        node.baseY += node.speedY;

        // Bounce from boundaries
        if (node.baseX < 0 || node.baseX > width) node.speedX *= -1;
        if (node.baseY < 0 || node.baseY > height) node.speedY *= -1;

        node.angle += node.angleSpeed;
        node.pulseIntensity += node.pulseRate;

        // Mouse displacement
        const dx = node.baseX - mouse.x;
        const dy = node.baseY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = node.baseX;
        let targetY = node.baseY;

        if (dist < mouse.radius) {
          const force = (1 - dist / mouse.radius) * 35;
          targetX += (dx / dist) * force;
          targetY += (dy / dist) * force;
        }

        // Smoothly glide to actual render coords
        node.x += (targetX - node.x) * 0.08;
        node.y += (targetY - node.y) * 0.08;

        // Pulse sizes
        const pulse = Math.sin(node.pulseIntensity) * 1.5;
        const size = Math.max(1, node.size + pulse);

        // Draw node aura (glow blob)
        ctx.shadowBlur = 0; // Standard Canvas shadow is slow, we use multiple concentric transparent shapes
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 5);
        gradient.addColorStop(0, node.color.replace('0.4', '0.6').replace('0.3', '0.5'));
        gradient.addColorStop(0.3, node.color.replace('0.4', '0.2').replace('0.3', '0.15'));
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw solid node core
        ctx.fillStyle = node.color.replace('0.4', '1').replace('0.3', '1');
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Mouse proximity waveform wave around the node
        if (dist < mouse.radius) {
          const alpha = (1 - dist / mouse.radius) * 0.45;
          ctx.strokeStyle = node.color.replace('0.4', `${alpha}`).replace('0.3', `${alpha}`);
          ctx.lineWidth = 1;
          
          // Render miniature audio waveform circle representing syn_node active resonance
          ctx.beginPath();
          const rings = 30;
          for (let r = 0; r <= rings; r++) {
            const currentAngle = (r / rings) * Math.PI * 2;
            const resFreq = Math.sin(node.angle + r * node.frequency) * Math.cos(node.angle * 1.5);
            const extraRadius = size * 3 + resFreq * (node.amplitude * (1 - dist / mouse.radius) * 0.5);
            
            const rx = node.x + Math.cos(currentAngle) * extraRadius;
            const ry = node.y + Math.sin(currentAngle) * extraRadius;
            
            if (r === 0) {
              ctx.moveTo(rx, ry);
            } else {
              ctx.lineTo(rx, ry);
            }
          }
          ctx.closePath();
          ctx.stroke();
        }
      });

      // Draw mouse cursor coordinates & dynamic pulse halo
      if (mouse.active && mouse.x !== -1000) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 25, 0, Math.PI * 2);
        ctx.stroke();

        // Tech reticle accent around mouse cursor
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
